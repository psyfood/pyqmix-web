import React, { Component } from 'react';
import { Button, ButtonGroup, FormGroup, Input, Modal,
  ModalHeader, ModalBody, ModalFooter, Form, FormText,
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
// import logo from './snake.svg';
import './App.css';


class RepetitionsInput extends Component {
  render = () => {
    return <Input type="number"
                  value={this.props.value}
                  name={this.props.name}
                  onChange={this.props.onChange}
                  onBlur={this.props.onBlur}
                  min="1"
                  placeholder="No. of repetitions."
                  required/>
  }
}


class PumpForm extends Component {

  // --- State --- //
  state = {

    // System setup
    webConnectedToPumps: false,  // Does the website think the pumps are connected (based on user-input, not backend)
    isPumpConfigSetUp: false,  // Are the pumps configured in the backend
    userEnteredPumpConfiguration: false,  // Method to wait for user input on config-name and pump-type
    availableConfigurations: [],
    availableSyringeTypes: [],
    configurationPath: "",
    selectedQmixConfig: "",
    selectedSyringeType: "",
    userEnteredBubbleToggle: "",

    // Pumps
    pumps: [],  // Pump parameters received from backend
    selectedPumps: [],  // Pump_ID's selected by user. Defined by index of pumps in state.pumps.

    // Which subform did the user execute
    activeSubform: "",
    requestCounter: 0,

    // Repetition
    repetitions: {
      'fill': [],
      'empty': [],
      'rinse': []
    },

    // Volume
    targetVolume: {
      'targetVolume': []
    },
    volumeUnit: {
      'targetVolume': "mL"
    },

    // Flow
    flowRate: {
      'fill': [],
      'empty': [],
      'bubble': [],
      'rinse': [],
      'targetVolume': []
    },
    flowUnit: {
      'fill': "mL/s",
      'empty': "mL/s",
      'bubble': "mL/s",
      'rinse': "mL/s",
      'targetVolume': "mL/s"
    },

    // Modals
    modal: {
      'referenceMove': false,
      'fill': false,
      'empty': false,
      'bubbleCycleStart': false,
      'bubbleCycleMiddle': false,
      'bubbleCycleEnd': false,
      'rinse': false,
      'locateConfigFiles': false,
      'noConfigOrDllFound': false,
      'configDropDownOpen': false,
      'syringeDropDownOpen': false
    },
  };

  // --- Update state by Configuration and Syringe Size fields --- //
  handleConfigNameChange = (e) => this.setState({selectedQmixConfig: e.target.innerText});
  handleSyringeTypeChange = (e) => this.setState({selectedSyringeType: e.target.innerText});
  handleConfigPathChange = (e) => {
    this.setState({configurationPath: e.target.value});
    this.updateAvailableConfigurations(e.target.value);
  };
  handleLocatingConfig = () => {
    this.toggle('locateConfigFiles');
    this.setState({userEnteredPumpConfiguration: true})
  };

  // --- Open and close individual modals --- //
  toggle = (modalType) => {
    let modals = this.state.modal;
    modals[modalType] = !modals[modalType];
    this.setState({modal: modals})
  };

  // --- Set single element of dictionary in state --- //
  handleStateChange = (stateKey, dictKey, value) => {

    this.setState({activeSubform: dictKey});

    let tmpState = this.state[stateKey];
    tmpState[dictKey] = value;
    this.setState({[stateKey]: tmpState});
  };

  // --- Async set state --- //
  asyncSetState = (stateNameChange) => {
    return new Promise(resolve => this.setState(stateNameChange, resolve))
  };

  // --- Create list of detected pumps --- //
  createListOfDetectedPumpIDs = () => {
    return this.state.pumps.map(p => p.pump_id)
  };

  // --- Update state.selectedPumps based on which pumps the user selected --- //
  handleSelectedPumpList = (selected) => {
    const index = this.state.selectedPumps.indexOf(selected);
    if (index < 0) {
      this.state.selectedPumps.push(selected);
    } else {
      this.state.selectedPumps.splice(index, 1);
    }
    this.setState({ selectedPumps: [...this.state.selectedPumps] });
  };

  // --- Repetition --- //
  getActiveRepetition = (state) => {
    let repetitions = state.repetitions;
    let activeSubform = state.activeSubform;
    return repetitions[activeSubform];
  };

  checkRepetitionInput = () => {

    const activeSubform = this.state.activeSubform;

    let repetition = this.state.repetitions[activeSubform];
    if (repetition < 1) {
      this.handleStateChange('repetitions', activeSubform, 1);
    }
  };

  // --- Volume --- //
  computeConversionFactorOfVolumeUnitToMilliLitres = (e) => {
    let factor;
    switch (e) {
      case "mL":
        factor = 1;
        break;
      case "cL":
        factor = 10;
        break;
      default:
        console.log('An unknown volume unit was used');
    }
    return factor
  };

  getActiveTargetVolume = (state) => {
    let targetVolume = state.targetVolume;
    let activeSubform = state.activeSubform;
    return targetVolume[activeSubform]
  };

  getActiveVolumeUnit = (state) => {
    let volumeUnit = state.volumeUnit;
    let activeSubform = state.activeSubform;
    return volumeUnit[activeSubform]
  };

  computeVolumeMilliLitres = (state) => {
    let targetVolume = this.getActiveTargetVolume(state);
    let volumeUnit = this.getActiveVolumeUnit(state);
    let factor = this.computeConversionFactorOfVolumeUnitToMilliLitres(volumeUnit);
    return targetVolume * factor;
  };

  computeMaximallyAllowedVolumeUnitAsSpecifiedInForm = () => {
    if (this.state.selectedPumps.length > 0) {
      let maxAllowedVolume = this.computeSmallestSyringeVolumeMilliLitres();
      let volumeUnit = this.getActiveVolumeUnit(this.state);
      let factor = this.computeConversionFactorOfVolumeUnitToMilliLitres(volumeUnit);
      return (maxAllowedVolume / factor);
    } else {return []}
  };

  computeSmallestSyringeVolumeMilliLitres = () => {
    // Syringe volume is always set to mL in this.state.pumps
    if (this.state.selectedPumps.length > 0) {
      let selectedPumps = this.state.pumps.filter( (e) => this.state.selectedPumps.includes(e.pump_id) );
      let pumpWithMinSyringeSize = selectedPumps.sort((x, y) => y.syringe_volume - x.syringe_volume).pop();
      let smallestSyringeSize = pumpWithMinSyringeSize.syringe_volume;
      return smallestSyringeSize.toString();
    } else {return ""}
  };

  checkTargetVolumeInput = () => {

    const activeSubform = this.state.activeSubform;

    if (this.computeSmallestSyringeVolumeMilliLitres() < this.computeVolumeMilliLitres(this.state)) {
      console.log('Maximum volume exceeded, setting flow rate to maximum allowed value');
      let targetVolume = this.computeMaximallyAllowedVolumeUnitAsSpecifiedInForm();
      this.handleStateChange('targetVolume', activeSubform, targetVolume);
    }
    if (this.computeVolumeMilliLitres(this.state) < 0) {
      console.log('Volume cannot be negative. Setting target volume to zero.');
      this.handleStateChange('targetVolume', activeSubform, 0);
    }
  };

  // --- Flow --- //
  computeConversionFactorOfFlowUnitToMilliLitres = (flowUnit) => {

    let factor;
    switch (flowUnit) {
      case "mL/s":
        factor = 1;
        break;
      case "cL/s":
        factor = 10;
        break;
      case "mL/min":
        factor = 1/60;
        break;
      case "cL/min":
        factor = 1/6;
        break;
      default:
        console.log('An unknown flow-rate unit was used')
    }
    return factor;
  };

  computeFlowMilliLitresPerSecond = (state) => {
    let activeSubform = state.activeSubform;
    let flowRate = state.flowRate[activeSubform];
    let flowUnit = state.flowUnit[activeSubform];

    let factor = this.computeConversionFactorOfFlowUnitToMilliLitres(flowUnit);
    return flowRate * factor;
  };

  computeMaximallyAllowedFlowRateMilliLitresPerSecond = () => {
    if (this.state.selectedPumps.length > 0) {
      let selectedPumps = this.state.pumps.filter((e) => this.state.selectedPumps.includes(e.pump_id));
      let pumpWithMinFlowRate = selectedPumps.sort((x, y) => y.max_flow_rate - x.max_flow_rate).pop();
      return pumpWithMinFlowRate.max_flow_rate;
    } else {return 0}
  };

  computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm = (activeSubform) => {

    if (this.state.selectedPumps.length > 0) {
      let maxAllowedFlow = this.computeMaximallyAllowedFlowRateMilliLitresPerSecond();
      let flowUnit = this.state.flowUnit[activeSubform];
      let factor = this.computeConversionFactorOfFlowUnitToMilliLitres(flowUnit);
      return (maxAllowedFlow / factor).toString();
    } else {return ""}
  };

  checkFlowRateInput = () => {

    const activeSubform = this.state.activeSubform;

    if (this.computeMaximallyAllowedFlowRateMilliLitresPerSecond() < this.computeFlowMilliLitresPerSecond(this.state)) {
      console.log('Maximum flow rate exceeded, setting flow rate to maximum allowed value');
      let flowRate = parseFloat(this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm(activeSubform));
      this.handleStateChange('flowRate', activeSubform, flowRate);
    }
    if (this.computeFlowMilliLitresPerSecond(this.state) < 0) {
      console.log('Flow rate cannot be negative. Setting flow rate to zero.');
      this.handleStateChange('flowRate', activeSubform, 0);
    }
  };

  // Checks whether the bus is ready to be initialized
  handlePumpConfiguration = async (e) => {
    console.log('Is pump configuration set up already?: ' + this.state.isPumpConfigSetUp);

    // Update state on whether the pump configuration is set up if it's not already registered in the state
    if (this.state.isPumpConfigSetUp === false) {
      await this.getConfigurationInfo();
    }

    // User must set up the pump configuration if it was not set up in the backend (only if the user has pressed detect pumps)
    if (this.state.isPumpConfigSetUp === false && this.state.webConnectedToPumps === false) {
      console.log('Pump configuration was not set up in the backend. User needs to set it up.');

      // Update state with available Qmix configutations in the backend
      await this.getConfigurationInfo();

      // Modal asks the user to select one of the available config directories by a dropdown
      this.toggle('locateConfigFiles');
      await this.waitForConfigFilesToBeSet();
      console.log('The user chose config: ' + this.state.selectedQmixConfig +
        ' and syringe type: ' + this.state.selectedSyringeType);

      // Send the files to the backend
      let payload;
      payload = {'configName': this.state.selectedQmixConfig,
        'syringeType': this.state.selectedSyringeType
      };
      await fetch('/api/config', {
        method: 'put',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }
    this.setState({userEnteredPumpConfiguration: false}); // reset state
    this.handleConnectPumps();
  };

  getConfigurationInfo = async () => {
    const response = await fetch('/api/config', {
      method: 'get',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
    });
    const json = await response.json();
     // Uncommented since I want to configure pumps every time I press 'Detect Pumps'
    // await this.asyncSetState({isPumpConfigSetUp: json['is_config_set_up']});
    await this.asyncSetState({isPumpConfigSetUp: false});
    await this.asyncSetState({availableConfigurations: json['available_configs']});
    await this.asyncSetState({availableSyringeTypes: json['available_syringes']});
    await this.asyncSetState({configurationPath: json['configuration_path']});

    // Use first item as default.
    const defaultConfig = this.state.availableConfigurations[0];
    await this.asyncSetState({selectedQmixConfig: defaultConfig});
    const defaultSyringeType = this.state.availableSyringeTypes[0];
    await this.asyncSetState({selectedSyringeType: defaultSyringeType})
  };

  updateAvailableConfigurations = async (configPath) => {
    let payload = {configPath: configPath};
    const response = await fetch('/api/config_update', {
      method: 'put',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    await this.asyncSetState({availableConfigurations: json['available_configs']});

    const defaultConfig = this.state.availableConfigurations[0];
    await this.asyncSetState({selectedQmixConfig: defaultConfig});
  };

  // --- Function to wait for user input --- //
  waitForConfigFilesToBeSet = async () => {
    do {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } while (this.state.userEnteredPumpConfiguration === false);
  };

  // Detect pumps and return a list of them, or disconnect pumps
  handleConnectPumps = () => {
    this.setState({webConnectedToPumps: !this.state.webConnectedToPumps},
      async () => {
        let payload = {pumpInitiate: this.state.webConnectedToPumps};  // message to connect or disconnect pumps
        console.log('Will try to connect to pumps: ' + payload['pumpInitiate'].toString());
        const response = await fetch('/api/pumps', {
          method: 'put',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const status = await response.json();
        // Pumps were successfully connected
        if (status && payload['pumpInitiate']) {
          await this.getConfigurationInfo();
          await this.getPumpStates()
        }
        // Pumps were unsuccessfully connected
        else if (status === false && payload['pumpInitiate']) {
          console.log('Pumps were unsuccessfully connected. ' +
            'Make sure all bus connections to the pumps are closed.');
          this.setState({webConnectedToPumps: !this.state.webConnectedToPumps});
          this.setState({selectedPumps: []});
          this.setState({pumps: []});
          // inform the user of the error
          this.toggle('noConfigOrDllFound');

        }
        // Pumps were successfully disconnected
        else if (payload['pumpInitiate'] === false) {
          this.setState({selectedPumps: []});
          this.setState({pumps: []});
        }
      }
    )};

  deepCopy = (object) => {
    const deepCopyString = JSON.stringify(object);
    return JSON.parse(deepCopyString);
  };

  handlePumpOperation = async (subform) => {

    // Send request to backend to stop pumps
    await fetch('/api/stop', {
      method: 'put',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({'stop': true})
    });

    // Update request counter in state
    await this.asyncSetState({requestCounter: this.state.requestCounter+1});

    // Update active subform in state
    await this.asyncSetState({activeSubform: subform});

    // Deeo copy of this.state
    const thisStateDeepCopy = this.deepCopy(this.state);

    switch (subform) {
      case "referenceMove":
        this.handleReferenceMove(thisStateDeepCopy);
        break;
      case "fill":
        this.handleFill(thisStateDeepCopy);
        break;
      case "empty":
        this.handleEmpty(thisStateDeepCopy);
        break;
      case "bubble":
        this.handleBubbleCycle(thisStateDeepCopy);
        break;
      case "rinse":
        this.handleRinse(thisStateDeepCopy);
        break;
      case "targetVolume":
        this.handleTargetVolumeChange(thisStateDeepCopy);
        break;
      default:
        console.log('An unknown pump operation was initiated')
    }
  };

  // --- Reference move --- //
  handleReferenceMove = async (deepCopyState) => {

    // To remove the modal
    this.toggle('referenceMove');
    await this.sendCommmandToPumps('referenceMove', deepCopyState);
  };

  // --- Fill pumps --- //
  handleFill = async (deepCopyState) => {

    // To remove the modal
    this.toggle('fill');

    // Set pumps to fill level
    await this.sendCommmandToPumps('fill', deepCopyState);

    // Iterate over repetitions
    let repIndex;
    for (repIndex = 1; repIndex < this.getActiveRepetition(deepCopyState); repIndex++ ) {

      // Empty syringes
      await this.sendCommmandToPumps('empty', deepCopyState);

      // Set pumps to fill level
      await this.sendCommmandToPumps('fill', deepCopyState);
    }
  };

  // --- Empty syringes --- //
  handleEmpty = async (deepCopyState) => {

    // To remove the modal
    this.toggle('empty');

    // Empty syringes
    await this.sendCommmandToPumps('empty', deepCopyState);

    // Iterate over repetitions
    let repIndex;
    for (repIndex = 1; repIndex < this.getActiveRepetition(deepCopyState); repIndex++ ) {

      // Set pumps to fill level
      await this.sendCommmandToPumps('fill', deepCopyState);

      // Empty syringes
      await this.sendCommmandToPumps('empty', deepCopyState);
    }
  };

  // --- Function to wait for user input --- //
  waitBubbleToggle = async () => {
    do {
      await new Promise(resolve => setTimeout(resolve, 200));
    } while (this.state.userEnteredBubbleToggle === "");
  };

  handleBubbleCycleModal = (userResponse) => {
    console.log(userResponse);
    this.setState({userEnteredBubbleToggle: userResponse})
  };

  // --- Bubble cycle --- //
  handleBubbleCycle = async (deepCopyState) => {

    // To remove the modal
    this.toggle('bubbleCycleStart');

    // Fill with stimulus
    await this.sendCommmandToPumps('fillToOneThird', deepCopyState);
    await this.waitForPumpingToFinish();

    // Continue with the SECOND step of the bubble Cycle if user did not choose
    // another pump cycle meanwhile
    if (deepCopyState.requestCounter === this.state.requestCounter) {

      this.toggle('bubbleCycleMiddle');

      // Wait for user feedback and reset state
      await this.waitBubbleToggle();
      this.toggle('bubbleCycleMiddle');

      // Abort bubble cycle or continue with the second step
      if (this.state.userEnteredBubbleToggle === "cancel") {
        this.setState({userEnteredBubbleToggle: ""});
      } else if (this.state.userEnteredBubbleToggle === "continue") {
        this.setState({userEnteredBubbleToggle: ""});
        this.handleBubbleCycleMiddle(deepCopyState)
      }
    }
  };

  handleBubbleCycleMiddle = async (deepCopyState) => {

    // Fill in air
    await this.sendCommmandToPumps('fillToTwoThird', deepCopyState);

    // Empty syringes
    await this.sendCommmandToPumps('empty', deepCopyState);
    await this.waitForPumpingToFinish();

    if (deepCopyState.requestCounter === this.state.requestCounter) {
      this.toggle('bubbleCycleEnd');

      // Wait for user feedback and reset state
      await this.waitBubbleToggle();
      this.toggle('bubbleCycleEnd');

      // Abort bubble cycle or continue with the third step
      if (this.state.userEnteredBubbleToggle === "cancel") {
        this.setState({userEnteredBubbleToggle: ""});
      } else if (this.state.userEnteredBubbleToggle === "continue") {
        this.setState({userEnteredBubbleToggle: ""});
        this.handleBubbleCycleEnd(deepCopyState)
      }
    }
  };

  handleBubbleCycleEnd = async (deepCopyState) => {

    // Fill in stimulus
    await this.sendCommmandToPumps('fill', deepCopyState);

    // Fill in stimulus
    await this.sendCommmandToPumps('empty', deepCopyState);

    // Finish up by filling to level
    await this.sendCommmandToPumps('fill', deepCopyState);
  };

  // --- Rinse syringes --- //
  handleRinse = async (deepCopyState) => {

    // To remove the modal
    this.toggle('rinse');

    // Iterate over repetitions
    let repIndex;
    for (repIndex = 0; repIndex < this.getActiveRepetition(deepCopyState); repIndex++ ) {

      // Empty syringes
      await this.sendCommmandToPumps('empty', deepCopyState);

      // Fill syringes
      await this.sendCommmandToPumps('fill', deepCopyState);

      // Empty syringes
      await this.sendCommmandToPumps('empty', deepCopyState);
    }
  };

  // --- Set target volume of syringes --- //
  handleTargetVolumeChange = async (deepCopyState) => {

    // Fill to level
    await this.sendCommmandToPumps('fillToLevel', deepCopyState);

  };

  // --- Send pump command to backend --- //
  sendCommmandToPumps = async (action, deepCopyState) => {

    // Send command if user did not disconnect pumps.
    if (this.state.webConnectedToPumps) {
      await this.waitForPumpingToFinish();

      if (deepCopyState.requestCounter === this.state.requestCounter) {
        for (let Index in deepCopyState.selectedPumps) {
          let pumpID = deepCopyState.selectedPumps[Index];
          let payload = await this.makePumpCommand(action, pumpID, deepCopyState);

          // Send information to pump-specific endpoint if user has not
          // disconnected pumps
          if (this.state.webConnectedToPumps) {
            fetch('/api/pumps/' + pumpID.toString(), {
              method: 'put',
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });
          }
        }
      }
    }
  };

  // --- Translate action to pump commands --- //
  makePumpCommand = async (pumpAction, PumpName, deepCopyState) => {

    let targetVolume;
    let pumpCommand;

    if (pumpAction === 'referenceMove') {
      pumpCommand = {action: pumpAction};
    } else if (pumpAction === 'fillToLevel' || pumpAction === 'fill' || pumpAction === 'empty' || pumpAction === 'fillToOneThird' || pumpAction === 'fillToTwoThird') {

      // If the command is fillToLevel, empty, or fill
      if (pumpAction === 'fillToLevel') {
        targetVolume = this.computeVolumeMilliLitres(deepCopyState);
      } else if (pumpAction === 'empty') {
        targetVolume = 0;
      } else if (pumpAction === 'fill') {
        targetVolume = deepCopyState.pumps[PumpName].syringe_volume
      } else if (pumpAction === 'fillToOneThird')  {
        let pump = deepCopyState.pumps.find(p => p.pump_id === PumpName);
        targetVolume = pump.syringe_volume * 1/3;
      } else if (pumpAction === 'fillToTwoThird') {
        let pump = deepCopyState.pumps.find(p => p.pump_id === PumpName);
        targetVolume = pump.syringe_volume * 2/3;
      }

      let flowRate = this.computeFlowMilliLitresPerSecond(deepCopyState);
      pumpCommand = {
        'action': pumpAction,
        'params': {
          'targetVolume': targetVolume,
          'flowRate': flowRate,
        }
      };
    } else {}
    return pumpCommand
  };

  // --- Function to wait for pumps to finish --- //
  waitForPumpingToFinish = async () => {
    await this.getPumpStates();
    do {
      console.log('Checking whether pumps are still pumping');
      await this.getPumpStates();
      await new Promise(resolve => setTimeout(resolve, 1000));
    } while (this.state.pumps.some(x => x.is_pumping));
  };

  // --- Ask backend for pump state --- //
  getPumpStates = async () => {
    const response = await fetch('/api/pumps', {
      method: 'get',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
    });
    const json = await response.json();
    console.log('Current pump state:');
    console.log(json);
    await this.asyncSetState({pumps: json['pump_states']});
  };

  //  This function is currently not used
  getPumpState = async (pumpName) => {
    const response = await fetch('/api/pumps/' + pumpName.toString(), {
      method: 'get',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
    });
    return await response.json();
  };

  // --- Render --- //
  render = () => {
    return (
      <div className="pump-form">

        <div className="button-group">

          <Button
            color="success"
            onClick={this.handlePumpConfiguration}>
            {this.state.webConnectedToPumps ? "Stop and Disconnect Pumps" : "Detect Pumps"}
          </Button>

          <Modal isOpen={this.state.modal['locateConfigFiles']}
                 className="modal-input">
            <ModalHeader>Select a pump configuration</ModalHeader>
            {/*<ModalBody></ModalBody>*/}
            <ModalHeader>
              <Form method="post"
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}>
                 <div className="form-row">

                    <div className="col">
                    {/*Specify configuration directory*/}
                    <h6>Configuration directory:</h6>
                    <FormGroup>
                      <input type="text"
                             className="form-control"
                             onChange={this.handleConfigPathChange}
                             placeholder={this.state.configurationPath}/>
                    </FormGroup>
                    </div>

                    <div className="col">
                    {/*Dropdown to choose configuration*/}
                    <h6>Select configuration:</h6>
                    <FormGroup>
                      <Dropdown isOpen={this.state.modal['configDropDownOpen']}
                                toggle={() => this.toggle('configDropDownOpen')}>
                        <DropdownToggle caret>
                          {this.state.selectedQmixConfig}
                        </DropdownToggle>
                        <DropdownMenu>
                          {this.state.availableConfigurations.map(config =>
                              <DropdownItem
                                  key={config}
                                  onClick={this.handleConfigNameChange}>
                                {config}
                              </DropdownItem>
                          )}
                        </DropdownMenu>
                      </Dropdown>
                    </FormGroup>
                    </div>
                  </div>

                <FormGroup>
                  <h6>Select syringe type:</h6>
                  <Dropdown isOpen={this.state.modal['syringeDropDownOpen']}
                            toggle={() => this.toggle('syringeDropDownOpen')}>
                    <DropdownToggle caret>
                      {this.state.selectedSyringeType}
                    </DropdownToggle>
                    <DropdownMenu>
                      {this.state.availableSyringeTypes.map(config =>
                        <DropdownItem
                          key={config}
                          onClick={this.handleSyringeTypeChange}>
                          {config}
                        </DropdownItem>
                      )}
                    </DropdownMenu>
                  </Dropdown>
                </FormGroup>

              </Form>
            </ModalHeader>

            <ModalFooter>
              <Button color="success"
                      disabled={this.state.availableConfigurations.length === 0}
                      onClick={this.handleLocatingConfig}> Continue </Button>
              <Button color="danger"
                      onClick={() => this.toggle('locateConfigFiles')}> Cancel </Button>
            </ModalFooter>
          </Modal>

          <Modal isOpen={this.state.modal['noConfigOrDllFound']}
                 className="modal-input">
            <ModalHeader >Error - no pumps were detected.</ModalHeader>
            <ModalBody>
              Ensure that:
              <ul>
                <li>You followed the gustometer installation <a href="https://github.com/psyfood/pyqmix#gustometer-setup">instructions.</a></li>
                <li>That you selected a valid pump configuration.</li>
                <li>That the pumps are powered on and connected to the computer.</li>
                <li>That the bus is not in use by another program, for example QmixElements.</li>
                <li>If the above approaches are unsuccessful, then try adding the directory of the Qmix SDK DLL's to the Windows path variable.</li>
              </ul>
              Then try again.
            </ModalBody>
            <ModalFooter>
              <Button color="success"
                      onClick={() => this.toggle('noConfigOrDllFound')}> OK </Button>
            </ModalFooter>
          </Modal>
        </div>

        <div className="button-group">
          <ButtonGroup>
            {this.createListOfDetectedPumpIDs().map(pump_id =>
              <Button color={"primary"}
                      key={pump_id}
                      onClick={() => this.handleSelectedPumpList(pump_id)}
                      active={this.state.selectedPumps.includes(pump_id)}>
                {'Pump ' + pump_id.toString()}
              </Button>
            )}
          </ButtonGroup>
          {/*<p>Selected: {JSON.stringify(this.state.selectedPumps)}</p>*/}
        </div>

        <div className="entire-input-form">

          {/*REFERENCE MOVE*/}
          <Form method="post"
                onSubmit={(e) => {
                  e.preventDefault();
                  this.toggle('referenceMove');
                }}>

            <FormGroup className="input-form">

              <div className="row">
                <div className="col-sm input-subform button-subform">
                  <Button color="success"
                          disabled={this.state.selectedPumps.length === 0}
                  > Reference Move </Button>
                  <FormText>Calibrate the selected pumps.</FormText>
                  <Modal isOpen={this.state.modal['referenceMove']}
                         className="modal-input">
                    <ModalHeader >Reference Move</ModalHeader>
                    <ModalBody>
                      Detach all syringes from the pumps before continuing.
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success" onClick={() => this.handlePumpOperation('referenceMove')}> Continue </Button>
                      <Button color="danger" onClick={() => this.toggle('referenceMove')}> Cancel </Button>
                    </ModalFooter>
                  </Modal>
                </div>

                {/* Just here to ensure correct grid spacing */}
                <div className="col-sm input-subform"></div>
                <div className="col-sm input-subform"></div>
                <div className="col-sm input-subform"></div>
              </div>
            </FormGroup>
          </Form>

          {/*FILL FORM*/}
          <Form method="post"
                onSubmit={(e) => {
                  e.preventDefault();
                  this.toggle('fill');
                }}>

            <FormGroup className="input-form">
              <div className="row">

                <div className="col-sm input-subform button-subform">
                  <Button color="success"
                          disabled={this.state.selectedPumps.length === 0}
                  > Fill Cycle </Button>
                  <FormText>Fill & empty the syringe multiple times. Ends with a filled syringe.</FormText>

                  <Modal isOpen={this.state.modal['fill']}
                         className="modal-input">
                    <ModalHeader>Fill</ModalHeader>
                    <ModalBody>
                      Insert the inlet tube into the stimulus reservoir and
                      detach the spray head if repeating the fill procedure.
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success"
                              onClick={() => this.handlePumpOperation('fill')}> Continue
                      </Button>
                      <Button color="danger"
                              onClick={() => this.toggle('fill')}> Cancel
                      </Button>
                    </ModalFooter>
                  </Modal>
                </div>

                <div className="col-sm input-subform nrep-subform">
                  {/*<Input type="number"*/}
                  {/*       value={this.state.repetitions['fill']}*/}
                  {/*       name="repetitions"*/}
                  {/*       min="1"*/}
                  {/*       placeholder="No. of repetitions."*/}
                  {/*       onChange={(e) => this.handleStateChange('repetitions', 'fill', e.target.value)}*/}
                  {/*       onBlur={() => this.checkRepetitionInput()}*/}
                  {/*       required/>*/}
                   <RepetitionsInput
                     value={this.state.repetitions['fill']}
                     onChange={(e) => this.handleStateChange('repetitions', 'fill', e.target.value)}
                     onBlur={() => this.checkRepetitionInput()}
                   />
                </div>

                {/* Just here to ensure correct grid spacing */}
                <div className="col-sm input-subform"></div>

                <div className="col-sm input-subform flowrate-subform">
                  <Input type="number"
                         value={this.state.flowRate['fill']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="flowRate"
                         min="0"
                         max={this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm('fill')}
                         placeholder="Flow rate."
                         onChange={(e) => this.handleStateChange('flowRate', 'fill', e.target.value)}
                         onBlur={() => this.checkFlowRateInput()}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit['fill']}
                         onBlur={() => this.checkFlowRateInput()}
                         onChange={(e) => this.handleStateChange('flowUnit', 'fill', e.target.value)}>
                    <option value="mL/s">mL/s</option>
                    <option value="mL/min">mL/min</option>
                    <option value="cL/s">cL/s</option>
                    <option value="cL/min">cL/min</option>
                  </Input>
                </div>
              </div>
            </FormGroup>
          </Form>


          {/*EMPTY FORM*/}
          <Form method="post"
                onSubmit={(e) => {
                  e.preventDefault();
                  this.toggle('empty');
                }}>

            <FormGroup className="input-form">
              <div className="row">

                <div className="col-sm input-subform button-subform">
                  <Button color="success"
                          disabled={this.state.selectedPumps.length === 0}
                  > Empty Cycle </Button>
                  <FormText>Empty & fill the syringe multiple times. Ends with an empty syringe.</FormText>

                  <Modal isOpen={this.state.modal['empty']}
                         className="modal-input">
                    <ModalHeader>Empty</ModalHeader>
                    <ModalBody>
                      Remove the inlet tube from the stimulus reservoir and
                      detach the spray head from the mouthpiece.
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success"
                              onClick={() => this.handlePumpOperation('empty')}> Continue </Button>
                      <Button color="danger"
                              onClick={() => this.toggle('empty')}> Cancel </Button>
                    </ModalFooter>
                  </Modal>
                </div>

                <div className="col-sm input-subform nrep-subform">
                  {/*<Input type="number"*/}
                  {/*       value={this.state.repetitions['empty']}*/}
                  {/*       name="repetitions"*/}
                  {/*       min="1"*/}
                  {/*       placeholder="No. of repetitions."*/}
                  {/*       onChange={(e) => this.handleStateChange('repetitions', 'empty', e.target.value)}*/}
                  {/*       onBlur={() => this.checkRepetitionInput()}*/}
                  {/*       required/>*/}
                  <RepetitionsInput
                    value={this.state.repetitions['empty']}
                    onChange={(e) => this.handleStateChange('repetitions', 'empty', e.target.value)}
                    onBlur={() => this.checkRepetitionInput()}
                  />
                </div>

                {/* Just here to ensure correct grid spacing */}
                <div className="col-sm input-subform"></div>

                <div className="col-sm input-subform flowrate-subform">
                  <Input type="number"
                         value={this.state.flowRate['empty']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="flowRate"
                         min="0"
                         max={this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm('empty')}
                         placeholder="Flow rate."
                         onChange={(e) => this.handleStateChange('flowRate', 'empty', e.target.value)}
                         onBlur={() => this.checkFlowRateInput()}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit['empty']}
                         onBlur={() => this.checkFlowRateInput()}
                         onChange={(e) => this.handleStateChange('flowUnit', 'empty', e.target.value)}>
                    <option value="mL/s">mL/s</option>
                    <option value="mL/min">mL/min</option>
                    <option value="cL/s">cL/s</option>
                    <option value="cL/min">cL/min</option>
                  </Input>
                </div>
              </div>
            </FormGroup>
          </Form>

          {/*BUBBLE CYCLE FORM*/}
          <Form method="post"
                onSubmit={(e) => {
                  e.preventDefault();
                  this.toggle('bubbleCycleStart');
                }}>

            <FormGroup className="input-form">
              <div className="row">

                <div className="col-sm input-subform button-subform">
                  <Button color="success"
                          disabled={this.state.selectedPumps.length === 0}
                  > Bubble Cycle </Button>
                  <FormText>Guided procedure to remove air bubbles trapped in the syringe. Ends with a filled syringe.</FormText>
                  <Modal isOpen={this.state.modal['bubbleCycleStart']}
                         className="modal-input">
                    <ModalHeader>Bubble Cycle</ModalHeader>
                    <ModalBody>
                      Insert the inlet tube into the stimulus reservoir.
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        color="success"
                        onClick={() => this.handlePumpOperation('bubble')}> Continue </Button>
                      <Button
                        color="danger"
                        onClick={() => this.toggle('bubbleCycleStart')}> Cancel </Button>
                    </ModalFooter>
                  </Modal>
                  <Modal isOpen={this.state.modal['bubbleCycleMiddle']}
                         className="modal-input">
                    <ModalHeader>Bubble Cycle</ModalHeader>
                    <ModalBody>
                      Remove the inlet tube from the stimulus reservoir to aspirate air.
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        color="success"
                        onClick={() => this.handleBubbleCycleModal('continue')}> Continue
                      </Button>
                      <Button
                        color="danger"
                        onClick={() => this.handleBubbleCycleModal('cancel')}> Cancel
                      </Button>
                    </ModalFooter>
                  </Modal>
                  <Modal isOpen={this.state.modal['bubbleCycleEnd']}
                         className="modal-input">
                    <ModalHeader>Bubble Cycle</ModalHeader>
                    <ModalBody>
                      Insert the inlet tube into the stimulus reservoir.
                      This is the final step in the Bubble Cycle procedure.
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success"
                              onClick={() => this.handleBubbleCycleModal('continue')}> Continue </Button>
                      <Button color="danger"
                              onClick={() => this.handleBubbleCycleModal('cancel')}> Cancel </Button>
                    </ModalFooter>
                  </Modal>
                </div>

                {/* Just here to ensure correct grid spacing */}
                <div className="col-sm input-subform"></div>
                <div className="col-sm input-subform"></div>

                <div className="col-sm input-subform flowrate-subform">
                  <Input type="number"
                         value={this.state.flowRate['bubble']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="flowRate"
                         min="0"
                         max={this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm('bubble')}
                         placeholder="Flow rate."
                         onChange={(e) => this.handleStateChange('flowRate', 'bubble', e.target.value)}
                         onBlur={() => this.checkFlowRateInput()}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit['bubbleCycle']}
                         onBlur={() => this.checkFlowRateInput()}
                         onChange={(e) => this.handleStateChange('flowUnit', 'bubble', e.target.value)}>
                    <option value="mL/s">mL/s</option>
                    <option value="mL/min">mL/min</option>
                    <option value="cL/s">cL/s</option>
                    <option value="cL/min">cL/min</option>
                  </Input>
                </div>
              </div>
            </FormGroup>
          </Form>

          {/*RINSE FORM*/}
          <Form method="post"
                onSubmit={(e) => {
                  e.preventDefault();
                  this.toggle('rinse');
                }}>

            <FormGroup className="input-form">
              <div className="row">

                <div className="col-sm input-subform button-subform">
                  <Button color="success"
                          disabled={this.state.selectedPumps.length === 0}
                  > Rinse Cycle </Button>
                  <FormText>Empty & fill the syringe multiple times. Ends with an empty syringe.</FormText>
                  <Modal isOpen={this.state.modal['rinse']}
                         className="modal-input">
                    <ModalHeader>Rinse</ModalHeader>
                    <ModalBody>
                      Insert the inlet tube into the rinsing fluid
                      and detach the spray head from the mouthpiece.
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success"
                              onClick={() => this.handlePumpOperation('rinse')}> Continue </Button>
                      <Button color="danger"
                              onClick={() => this.toggle('rinse')}> Cancel
                      </Button>
                    </ModalFooter>
                  </Modal>
                </div>

                <div className="col-sm input-subform nrep-subform">
                  {/*<Input type="number"*/}
                  {/*       value={this.state.repetitions['rinse']}*/}
                  {/*       name="repetitions"*/}
                  {/*       min="1"*/}
                  {/*       placeholder="No. of repetitions."*/}
                  {/*       onChange={(e) => this.handleStateChange('repetitions', 'rinse', e.target.value)}*/}
                  {/*       onBlur={() => this.checkRepetitionInput()}*/}
                  {/*       required/>*/}
                   <RepetitionsInput
                     value={this.state.repetitions['rinse']}
                     onChange={(e) => this.handleStateChange('repetitions', 'rinse', e.target.value)}
                     onBlur={() => this.checkRepetitionInput()}
                   />
                </div>

                {/* Just here to ensure correct grid spacing */}
                <div className="col-sm input-subform"></div>

                <div className="col-sm input-subform flowrate-subform">
                  <Input type="number"
                         value={this.state.flowRate['rinse']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="flowRate"
                         min="0"
                         max={this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm('rinse')}
                         placeholder="Flow rate."
                         onBlur={() => this.checkFlowRateInput()}
                         onChange={(e) => this.handleStateChange('flowRate', 'rinse', e.target.value)}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit['rinse']}
                         onBlur={() => this.checkFlowRateInput()}
                         onChange={(e) => this.handleStateChange('flowUnit', 'rinse', e.target.value)}>
                    <option value="mL/s">mL/s</option>
                    <option value="mL/min">mL/min</option>
                    <option value="cL/s">cL/s</option>
                    <option value="cL/min">cL/min</option>
                  </Input>
                </div>
              </div>
            </FormGroup>
          </Form>

          {/*TARGET VOLUME*/}
          <Form method="post"
                onSubmit={ (e) => {
                  e.preventDefault();
                  this.handlePumpOperation('targetVolume');
                }}>

            <FormGroup className="input-form">
              <div className="row">
                <div className="col-sm input-subform button-subform">
                  <Button color="success"
                          disabled={this.state.selectedPumps.length === 0}
                  > Target Volume </Button>
                  <FormText>Set target volume of a syringe.</FormText>
                </div>

                {/* Just here to ensure correct grid spacing */}
                <div className="col-sm input-subform"></div>

                <div className="col-sm input-subform volume-subform">
                  <Input type="number"
                         value={this.state.targetVolume['targetVolume']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="targetVolume"
                         min="0"
                         max={this.computeSmallestSyringeVolumeMilliLitres('targetVolume')}
                         placeholder="Target volume."
                         onChange={(e) => this.handleStateChange('targetVolume', 'targetVolume', e.target.value)}
                         onBlur={() => this.checkTargetVolumeInput()}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.volumeUnit['targetVolume']}
                         onBlur={() => this.checkTargetVolumeInput()}
                         onChange={(e) => this.handleStateChange('volumeUnit', 'targetVolume', e.target.value)}>
                    <option value="mL">mL</option>
                    <option value="cL">cL</option>
                  </Input>
                </div>


                <div className="col-sm input-subform flowrate-subform">
                  <Input type="number"
                         value={this.state.flowRate['targetVolume']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="flowRate"
                         min="0"
                         max={this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm('targetVolume')}
                         placeholder="Flow rate."
                         onChange={(e) => this.handleStateChange('flowRate', 'targetVolume', e.target.value)}
                         onBlur={() => this.checkFlowRateInput()}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit['targetVolume']}
                         onBlur={() => this.checkFlowRateInput()}
                         onChange={(e) => this.handleStateChange('flowUnit', 'targetVolume', e.target.value)}>
                    <option value="mL/s">mL/s</option>
                    <option value="mL/min">mL/min</option>
                    <option value="cL/s">cL/s</option>
                    <option value="cL/min">cL/min</option>
                  </Input>
                </div>
              </div>
            </FormGroup>
          </Form>
        </div>
      </div>
    )
  }
}

class Outro extends Component {

  state = {
    pyqmixVersion: ""
  };

  componentDidMount(){
    this.getPyqmixVersion();
  }

  getPyqmixVersion = async () => {
    const response = await fetch('/api/pyqmix', {
      method: 'get',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
    });

    var pyqmixVersion;
    pyqmixVersion = response.ok ? await response.json() : "unknown";
    this.setState({pyqmixVersion: pyqmixVersion});

  };

  render = () => {
    return (
      <p>
        pyqmix version {this.state.pyqmixVersion}
      </p>
    )
  }
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">pyqmix-web</h1>
        </header>
        <div className="entire-pump-form">
          <PumpForm/>
        </div>
        <div className="outro entire-pump-form">
          <Outro/>
        </div>
      </div>
    );
  }
}

export default App;

