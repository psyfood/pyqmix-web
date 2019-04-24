from flask import Flask, request, send_from_directory
from flask_restplus import Api, Resource
from flask_restplus.fields import Float, Boolean, String, Nested
from pyqmix import QmixBus, config, QmixPump
from pyqmix.pump import syringes
import pyqmix
import os.path as op
import sys
from collections import OrderedDict


# Frontend static folder location depends on whether we are
# running from the pyqmix_web package, from PyInstaller, or "directly"
# (development mode).
if getattr(sys, '_MEIPASS', None) is None:
    RUNNING_FROM_PYINSTALLER = False

    if __package__ == 'pyqmix_backend':  # running "directly"
        static_folder = '../pyqmix_frontend/build'
    elif __package__ == 'pyqmix_web':  # running from package
        static_folder = op.join(op.dirname(__file__), 'frontend/build')
else:
    RUNNING_FROM_PYINSTALLER = True
    static_folder = op.join(sys._MEIPASS, 'pyqmix-web')

print('Serving static files from ' + static_folder)

app = Flask(__name__, static_folder=static_folder)
api = Api(app)


session_paramters = {
    'bus': None,
    'pumps': {},  # Dictionary of pump objects
    'get_pumps_states_call_count': 0}  # Initiate pumps in test scenario

flow_param = OrderedDict([('prefix', 'milli'),
                          ('volume_unit', 'litres'),
                          ('time_unit', 'per_second')])

## --- Empty config and let the user specify it --- ##
config.delete_config()

## --- Choose session type --- ##
app.config.from_object(__name__)
app.config['test_session'] = False
app.secret_key = 'secret_key'

## --- Flask-RESTPlus models --- ##
config_setup = api.model('config setup' , {
    'configName': String(description='Configuration name, i.e. the name of a sub-directory of C:/Users/Public/Documents/QmixElements/Projects/default_project/Configurations/',
                         required=True,
                         example='five_pumps'),
    'syringeType': String(description='Syringe type',
                         required=True,
                         example='25 mL glass')})

pump_client_request = api.model('Pumping request', {
    'targetVolume': Float(description='Target volume',
                          required=False,
                          example=5.0),
    'flowRate': Float(description='Flow rate',
                      required=False,
                      example=0.25)})

pump_client_request_nested = api.model('Pump request', {
    'action': String(description='action',
                     required=True,
                     example='referenceMove'),
    'params': Nested(pump_client_request)})

initiate_or_disconnect_pumps = api.model('Initiate pumps', {
    'PumpInitiate': Boolean(desription='Initiate pumps',
                            required=True,
                            example=True)})

stop_pumps = api.model('Stop pumps', {
    'stop': Boolean(description='Stop pumps',
                    required=True,
                    example=True)})


## --- Endpoints --- ##


@api.route('/api/')
class Main(Resource):

    pass


@api.route('/pyqmix-web/', defaults={'path': ''})
@api.route('/pyqmix-web/<path:path>')
class Main(Resource):
    def get(self, path):
        # print('the path is ' + path)
        if path == '':
            return send_from_directory(static_folder, 'index.html')
        else:
            return send_from_directory(static_folder, path)


@api.route('/api/pyqmix')
class PyqmixSetup(Resource):

    def get(self):
        return pyqmix.__version__


@api.route('/api/config')
class SetUpConfig(Resource):

    def get(self):
        # Return a list of available config-dirs and send to frontend
        try:
            list_of_available_configurations = config.get_available_qmix_configs()
        except:
            list_of_available_configurations = []  # If the default configuration does not exist

        if list_of_available_configurations:
            configuration_path = config.DEFAULT_CONFIGS_DIR
        else:  # If the default configuration path does not exist or if there are no configurations
            configuration_path = op.expanduser('~')
        list_of_available_configurations = config.get_available_qmix_configs(configs_dir=configuration_path)

        list_of_available_syringe_sizes = list(syringes.keys())

        # Return status of pump-setup
        config_setup = is_config_set_up()

        setup_dict = {'is_config_set_up': config_setup,
                      'available_configs': list_of_available_configurations,
                      'available_syringes': list_of_available_syringe_sizes,
                      'configuration_path': configuration_path}
        return setup_dict

    @api.expect(config_setup)
    def put(self):
        payload = request.json
        config_name = payload['configName']
        session_paramters['syringe_type'] = payload['syringeType']

        set_up_config(config_name=config_name)


@api.route('/api/config_update')
class UpdateConfig(Resource):

    def put(self):
        payload = request.json
        configuration_path = payload['configPath']
        try:
            list_of_available_configurations = config.get_available_qmix_configs(configs_dir=configuration_path)
        except:  # Return empty list if path does not exist
            list_of_available_configurations = []
        setup_dict = {'available_configs': list_of_available_configurations}

        return setup_dict


@api.route('/api/pumps')
class InitiateOrDisconnectPumps(Resource):

    def get(self):

        # Initiate test scenario
        session_paramters['get_pumps_states_call_count'] +=1

        # Return a list of each pump-dictionaries
        pump_states = []
        for pump_id in session_paramters['pumps']:
            pump_state = get_pump_state(pump_id)
            pump_states.append(pump_state)

        system_state = {'pump_states': pump_states}

        return system_state

    @api.expect(initiate_or_disconnect_pumps)
    def put(self):

        payload = request.json
        initiate_pumps = payload['pumpInitiate']
        print(f'Initiate pumps: {initiate_pumps}')

        if initiate_pumps:
            status = connect_pumps()
        else:
            status = disconnect_pumps()

        return status


@api.route('/api/stop')
class StopPumps(Resource):

    @api.expect(stop_pumps)
    def put(self):
        if not app.config['test_session']:
            list(session_paramters['pumps'].values())[0].stop_all_pumps()


@api.route('/api/pumps/<int:pump_id>')
class Pumps(Resource):
    def get(self, pump_id):

        pump_status = get_pump_state(pump_id=pump_id)

        return pump_status

    @api.expect(pump_client_request_nested)
    def put(self, pump_id):
        payload = request.json
        action = payload['action']

        print('action: ' + action)

        if action == 'referenceMove':
            pump_reference_move(pump_id)
        elif action == 'empty' or action == 'fill' or action == 'fillToLevel' or action == 'fillToOneThird' or action == 'fillToTwoThird':
            target_volume = payload['params']['targetVolume']
            flow_rate = payload['params']['flowRate']

            # Initiate pump command
            pump_set_fill_level(pump_id=pump_id, target_volume=target_volume, flow_rate=flow_rate)

        return 201


## --- Functions --- ##


def is_config_set_up():

    if app.config['test_session']:
        if session_paramters['get_pumps_states_call_count'] < 1:
            return False
        else:
            return True
    else:
        if not config.read_config()['qmix_config_dir']:
            return False
        else:
            return True


def set_up_config(config_name):

    if app.config['test_session']:
        print(f'Pump configuration is set up using '
              f'config name: {config_name}')
    else:
        config.set_qmix_config(config_name=config_name)


def connect_pumps():

    if app.config['test_session']:
        nb_pumps = 5
        available_pumps = [str(i) for i in range(0,nb_pumps)]
        pump_objects = list(range(0, nb_pumps))
        session_paramters['pumps'] = dict(zip(available_pumps, pump_objects))
        session_paramters['bus'] = 'I am a Qmix Bus.'
        return True
    else:
        if session_paramters['bus']:
            # Bus is already connected
            return True
        try:
            print('Initializing bus')
            session_paramters['bus'] = QmixBus()
            nb_pumps = QmixPump(index=0).n_pumps
            print(f'number of pumps: {nb_pumps}')
            pumps_id = [str(i) for i in range(0, nb_pumps)]
            pump_objects = [QmixPump(index=pump_index) for pump_index in range(0, nb_pumps)]
            session_paramters['pumps'] = dict(zip(pumps_id, pump_objects))
            for p in pumps_id:
                set_syringe_type(pump_id=p)
                standardize_syringe_parameter(pump_id=p)
            return True
        except:
            # If the bus connection could not be established
            return False


def disconnect_pumps():

    if not app.config['test_session']:
        list(session_paramters['pumps'].values())[0].stop_all_pumps()
        session_paramters['bus'].close()

    print(f'Bus before "closing": {session_paramters["bus"]}')
    session_paramters['bus'] = None
    print(f'Bus after "closing": {session_paramters["bus"]}')

    session_paramters['pumps'] = {}
    config.delete_config()

    return True


def get_pump_state(pump_id):

    pump = session_paramters['pumps'][str(pump_id)]

    if app.config['test_session']:
        pump_status = {
            'pump_id': pump_id,
            'is_pumping': session_paramters['get_pumps_states_call_count'] % 5 != 0,
            'fill_level': 20,
            'max_flow_rate': 2.5,
            'syringe_volume': 25,
            'name': 'Midpressure 3'}

    else:
        pump_status = {
            'pump_id': pump_id,
            'is_pumping': pump.is_pumping,
            'fill_level': pump.fill_level,
            'max_flow_rate': pump.max_flow_rate,
            'syringe_volume': pump.volume_max,
            'name': pump.name}

    return pump_status


def pump_set_fill_level(pump_id, target_volume, flow_rate):
    if app.config['test_session']:
        print(f'Starting virtual pump: {pump_id} and setting '
              f'target_volume to {target_volume} mL '
              f'at {flow_rate} mL/s')
    else:
        print(f'Starting pump: {pump_id} and setting '
              f'target_volume to {target_volume} mL '
              f'at {flow_rate} mL/s')

        session_paramters['pumps'][str(pump_id)].set_fill_level(level=target_volume, flow_rate=flow_rate, wait_until_done=False)


def pump_reference_move(pump_id):

    if app.config['test_session']:
        print(f'Calibrating virtual pump: {pump_id}')
    else:
        session_paramters['pumps'][str(pump_id)].calibrate()


def set_syringe_type(pump_id):

    pump = session_paramters['pumps'][str(pump_id)]
    syringe_type = session_paramters['syringe_type']

    pump.set_syringe_params_by_type(syringe_type)


def standardize_syringe_parameter(pump_id):

    # The frontend only sends requests in the unit of mL.
    # The syringe is therefore set to run with mL.

    pump = session_paramters['pumps'][str(pump_id)]

    if app.config['test_session']:
        pass
    else:
        pump.set_flow_unit(prefix=flow_param['prefix'],
                           volume_unit=flow_param['volume_unit'],
                           time_unit=flow_param['time_unit'])

        pump.set_volume_unit(prefix='milli', unit='litres')


if __name__ == '__main__':
    app.run(host='0.0.0.0')
