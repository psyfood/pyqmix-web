from pyqmix import QmixBus, config, QmixPump
import os.path as op
import time

print(config.read_config())

# config_dir = op.normpath('C:/Users/Public/Documents/QmixElements/Projects/default_project/Configurations/five_pumps_laptop')
config_dir = op.normpath('C:/Users/Public/Documents/QmixElements/Projects/default_project/Configurations/five_midpressure_pumps')
dll_dir = op.normpath('C:/Users/au278141/AppData/Local/QmixSDK')

config.set_qmix_config_dir(config_dir)
config.set_qmix_dll_dir(dll_dir)

bus = QmixBus()

time.sleep(4)

pump_1 = QmixPump(index=0)
pump_2 = QmixPump(index=1)
pump_3 = QmixPump(index=2)

pumps = [pump_1, pump_2]

for pump in pumps:
    pump.set_syringe_params(inner_diameter_mm=23.0329,
                            max_piston_stroke_mm=60)
    pump.set_flow_unit()
    pump.set_volume_unit()

config.delete_config()
config.read_config()


pump.set_fill_level(level=10, flow_rate=1, blocking_wait=False)

pump.set_fill_level(level=10, flow_rate=0.5, blocking_wait=True)

pump = dict(water=QmixPump(index=0, restore_drive_pos_counter=False))
#
pump['water'].set_fill_level(level=15, flow_rate=0.5, blocking_wait=True)
#

time.sleep(4)

bus.close()


