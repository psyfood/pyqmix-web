import React, { Component } from 'react';
import { Button, ButtonGroup, FormGroup, Input, Modal,
  ModalHeader, ModalBody, ModalFooter, Form, FormText,
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
// import logo from './snake.svg';
import './App.css';

// --- State --- //
class PumpForm extends Component {
  state = {

    // System setup
    webConnectedToPumps: false,  // Does the website think the pumps are connected (based on user-input, not backend)
    isPumpConfigSetUp: false,  // Are the pumps set up in the backend
    userEnteredPumpConfiguration: false,  // Method to wait for user input on config-name and pump-type
    availableConfigurations: [],
    availableSyringeTypes: [],
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
  getActiveRepetition = (activeSubform) => {
    let repetitions = this.state.repetitions;
    return repetitions[activeSubform];
  };

  checkRepetitionInput = (activeForm) => {
    let repetition = this.state.repetitions[activeForm];
    if (repetition < 1) {
      this.handleStateChange('repetitions', activeForm, 1);
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

  getActiveTargetVolume = (activeSubform) => {
    let targetVolume = this.state.targetVolume;
    return targetVolume[activeSubform]
  };

  getActiveVolumeUnit = (activeSubform) => {
    let volumeUnit = this.state.volumeUnit;
    return volumeUnit[activeSubform]
  };

  computeVolumeMilliLitres = (activeSubform) => {
    let targetVolume = this.getActiveTargetVolume(activeSubform);
    let volumeUnit = this.getActiveVolumeUnit(activeSubform);
    let factor = this.computeConversionFactorOfVolumeUnitToMilliLitres(volumeUnit);
    return targetVolume * factor;
  };

  computeMaximallyAllowedVolumeUnitAsSpecifiedInForm = (activeSubform) => {
    if (this.state.selectedPumps.length > 0) {
      let maxAllowedVolume = this.computeSmallestSyringeVolumeMilliLitres(activeSubform);
      let volumeUnit = this.getActiveVolumeUnit(activeSubform);
      let factor = this.computeConversionFactorOfVolumeUnitToMilliLitres(volumeUnit);
      return (maxAllowedVolume / factor);
    } else {return []}
  };

  computeSmallestSyringeVolumeMilliLitres = (activeSubform) => {
    // Syringe volume is always set to mL in this.state.pumps
    if (this.state.selectedPumps.length > 0) {
      let selectedPumps = this.state.pumps.filter( (e) => this.state.selectedPumps.includes(e.pump_id) );
      let pumpWithMinSyringeSize = selectedPumps.sort((x, y) => y.syringe_volume - x.syringe_volume).pop();
      let smallestSyringeSize = pumpWithMinSyringeSize.syringe_volume;
      return smallestSyringeSize.toString();
    } else {return ""}
  };

  checkTargetVolumeInput = (activeSubform) => {
    if (this.computeSmallestSyringeVolumeMilliLitres(activeSubform) < this.computeVolumeMilliLitres(activeSubform)) {
      console.log('Maximum volume exceeded, setting flow rate to maximum allowed value');
      let targetVolume = this.computeMaximallyAllowedVolumeUnitAsSpecifiedInForm(activeSubform);
      this.handleStateChange('targetVolume', activeSubform, targetVolume);
    }
    if (this.computeVolumeMilliLitres(activeSubform) < 0) {
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

  computeFlowMilliLitresPerSecond = (activeSubform) => {
    let flowRate = this.state.flowRate[activeSubform];
    let factor = this.computeConversionFactorOfFlowUnitToMilliLitres(this.state.flowUnit[activeSubform]);
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
      let factor = this.computeConversionFactorOfFlowUnitToMilliLitres(this.state.flowUnit[activeSubform]);
      return (maxAllowedFlow / factor).toString();
    } else {return ""}
  };

  checkFlowRateInput = (activeSubform) => {
    if (this.computeMaximallyAllowedFlowRateMilliLitresPerSecond() < this.computeFlowMilliLitresPerSecond(activeSubform)) {
      console.log('Maximum flow rate exceeded, setting flow rate to maximum allowed value');
      let flowRate = parseFloat(this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm(activeSubform));
      this.handleStateChange('flowRate', activeSubform, flowRate);
    }
    if (this.computeFlowMilliLitresPerSecond(activeSubform) < 0) {
      console.log('Flow rate cannot be negative. Setting flow rate to zero.');
      this.handleStateChange('flowRate', activeSubform, 0);
    }
  };

  // Checks whether the bus is ready to be initialized
  handlePumpConfiguration = async (e) => {
    console.log('Is pump configuration set up already?: ' + this.state.isPumpConfigSetUp);

    // Update state on whether the pump configuration is set up if it's not already registered in the state
    if (this.state.isPumpConfigSetUp === false) {
      await this.getPumpStates();
      console.log('retrieving pump states from backend');
      console.log(this.state.isPumpConfigSetUp)
    }

    // User must set up the pump configuration if it was not set up in the backend (only if the user has pressed detect pumps)
    if (this.state.isPumpConfigSetUp === false && this.state.webConnectedToPumps === false) {
      console.log('Pump configuration was not set up in the backend. User needs to set it up.');

      // Update state with available Qmix configutations in the backend
      await this.getAvailableConfigurations();

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

  getAvailableConfigurations = async () => {
    const response = await fetch('/api/config', {
      method: 'get',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
    });
    const json = await response.json();
    await this.asyncSetState({availableConfigurations: json['available_configs']});
    await this.asyncSetState({availableSyringeTypes: json['available_syringes']});
    // Use first item as default.
    const defaultConfig = this.state.availableConfigurations[0];
    await this.asyncSetState({selectedQmixConfig: defaultConfig});
    const defaultSyringeType = this.state.availableSyringeTypes[0];
    await this.asyncSetState({selectedSyringeType: defaultSyringeType})
  };

  // --- Function to wait for user input --- //
  waitForConfigFilesToBeSet = async () => {
    do {
      await new Promise(resolve => setTimeout(resolve, 200));
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
          await this.getPumpStates();
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

    // Update request counter
    await this.asyncSetState({requestCounter: this.state.requestCounter+1});
    let requestCount = this.state.requestCounter;

    switch (subform) {
      case "referenceMove":
        this.handleReferenceMove(requestCount);
        break;
      case "fill":
        this.handleFill(requestCount);
        break;
      case "empty":
        this.handleEmpty(requestCount);
        break;
      case "bubbleCycle":
        this.handleBubbleCycle(requestCount);
        break;
      case "rinse":
        this.handleRinse(requestCount);
        break;
      case "targetVolume":
        this.handleTargetVolumeChange(requestCount);
        break;
      default:
        console.log('An unknown pump operation was initiated')
    }
  };

  // --- Reference move --- //
  handleReferenceMove = async (requestCount) => {

    // To remove the modal
    this.toggle('referenceMove');
    await this.sendCommmandToPumps('referenceMove', requestCount);
  };

  // --- Fill pumps --- //
  handleFill = async (requestCount) => {

    // To remove the modal
    this.toggle('fill');

    // Set pumps to fill level
    await this.sendCommmandToPumps('fill', requestCount);

    // Iterate over repetitions
    let repIndex;
    for (repIndex = 1; repIndex < this.getActiveRepetition(this.state.activeSubform); repIndex++ ) {

      // Empty syringes
      await this.sendCommmandToPumps('empty', requestCount);

      // Set pumps to fill level
      await this.sendCommmandToPumps('fill', requestCount);
    }
  };

  // --- Empty syringes --- //
  handleEmpty = async (requestCount) => {

    // To remove the modal
    this.toggle('empty');

    // Empty syringes
    await this.sendCommmandToPumps('empty', requestCount);

    // Iterate over repetitions
    let repIndex;
    for (repIndex = 1; repIndex < this.getActiveRepetition(this.state.activeSubform); repIndex++ ) {

      // Set pumps to fill level
      await this.sendCommmandToPumps('fill', requestCount);

      // Empty syringes
      await this.sendCommmandToPumps('empty', requestCount);
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
  handleBubbleCycle = async (requestCount) => {

    // To remove the modal
    this.toggle('bubbleCycleStart');

    // Fill with stimulus
    await this.sendCommmandToPumps('fillToOneThird', requestCount);

    // Continue with the SECOND step of the bubble Cycle
    await this.waitForPumpingToFinish();
    this.toggle('bubbleCycleMiddle');

    // Wait for user feedback and reset state
    await this.waitBubbleToggle();
    this.toggle('bubbleCycleMiddle');

    // Abort bubble cycle or continue with the second step
    if (this.state.userEnteredBubbleToggle === "cancel") {
      this.setState({userEnteredBubbleToggle: ""});
    } else if (this.state.userEnteredBubbleToggle === "continue") {
      this.setState({userEnteredBubbleToggle: ""});
      this.handleBubbleCycleMiddle(requestCount)
    }
  };

  handleBubbleCycleMiddle = async (requestCount) => {

    // Fill in air
    await this.sendCommmandToPumps('fillToTwoThird', requestCount);

    // Empty syringes
    await this.sendCommmandToPumps('empty', requestCount);

    await this.waitForPumpingToFinish();
    this.toggle('bubbleCycleEnd');

    // Wait for user feedback and reset state
    await this.waitBubbleToggle();
    this.toggle('bubbleCycleEnd');

    // Abort bubble cycle or continue with the third step
    if (this.state.userEnteredBubbleToggle === "cancel") {
      this.setState({userEnteredBubbleToggle: ""});
    } else if (this.state.userEnteredBubbleToggle === "continue") {
      this.setState({userEnteredBubbleToggle: ""});
      this.handleBubbleCycleEnd(requestCount)
    }
  };

  handleBubbleCycleEnd = async (requestCount) => {

    // Fill in stimulus
    await this.sendCommmandToPumps('fill', requestCount);

    // Fill in stimulus
    await this.sendCommmandToPumps('empty', requestCount);

    // Finish up by filling to level
    await this.sendCommmandToPumps('fill', requestCount);
  };

  // --- Rinse syringes --- //
  handleRinse = async (requestCount) => {

    // To remove the modal
    this.toggle('rinse');

    // Iterate over repetitions
    let repIndex;
    for (repIndex = 0; repIndex < this.getActiveRepetition(this.state.activeSubform); repIndex++ ) {

      // Empty syringes
      await this.sendCommmandToPumps('empty', requestCount);

      // Fill syringes
      await this.sendCommmandToPumps('fill', requestCount);

      // Empty syringes
      await this.sendCommmandToPumps('empty', requestCount);
    }
  };

  // --- Set target volume of syringes --- //
  handleTargetVolumeChange = async (requestCount) => {

    // Set state
    await this.asyncSetState({activeSubform: 'targetVolume'});

    // Fill to level
    await this.sendCommmandToPumps('fillToLevel', requestCount);

  };

  // --- Send pump command to backend --- //
  sendCommmandToPumps = async (action, requestCount) => {

    console.log('test whether the below output makes senses');
    console.log(requestCount === this.state.requestCounter);
    if (requestCount === this.state.requestCounter) {
      await this.waitForPumpingToFinish();

      let payload;
      for (let Index in this.state.selectedPumps) {
        let pumpID = this.state.selectedPumps[Index];
        payload = await this.makePumpCommand(action, pumpID);

        // Send information to pump-specific endpoint
        fetch('/api/pumps/'+pumpID.toString(), {
          method: 'put',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
    }
  };

  // --- Translate action to pump commands --- //
  makePumpCommand = async (pumpAction, PumpName) => {

    let pumpCommand;
    let targetVolume;

    if (pumpAction === 'referenceMove') {
      pumpCommand = {action: pumpAction};
    } else if (pumpAction === 'fillToLevel' || pumpAction === 'fill' || pumpAction === 'empty' || pumpAction === 'fillToOneThird' || pumpAction === 'fillToTwoThird') {

      // If the command is fillToLevel, empty, or fill
      if (pumpAction === 'fillToLevel') {
        targetVolume = this.computeVolumeMilliLitres(this.state.activeSubform);
      } else if (pumpAction === 'empty') {
        targetVolume = 0;
      } else if (pumpAction === 'fill') {
        targetVolume = this.state.pumps[PumpName].syringe_volume
      } else if (pumpAction === 'fillToOneThird')  {
        let pump = this.state.pumps.find(p => p.pump_id === PumpName);
        targetVolume = pump.syringe_volume * 1/3;
      } else if (pumpAction === 'fillToTwoThird') {
        let pump = this.state.pumps.find(p => p.pump_id === PumpName);
        targetVolume = pump.syringe_volume * 2/3;
      }

      let flowRate = this.computeFlowMilliLitresPerSecond(this.state.activeSubform);
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
      await new Promise(resolve => setTimeout(resolve, 200));
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
    await this.asyncSetState({isPumpConfigSetUp: json['config_setup']});
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
                 className={this.props.className}>
            <ModalHeader>Select a pump configuration</ModalHeader>
            {/*<ModalBody></ModalBody>*/}
            <ModalHeader>
              <Form method="post"
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}>
                {/*Dropdown for config name*/}
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

                <FormGroup>
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
              <Button color="success" onClick={this.handleLocatingConfig}> Continue </Button>
              <Button color="danger" onClick={() => this.toggle('locateConfigFiles')}> Cancel </Button>
            </ModalFooter>
          </Modal>

          <Modal isOpen={this.state.modal['noConfigOrDllFound']}
                 className={this.props.className}>
            <ModalHeader >Error - no pumps were detected.</ModalHeader>
            <ModalBody>
              Check that (1) the pumps are powered on and connected to the computer, and (2) that the bus is not
              connected already. Then try again.
            </ModalBody>
            <ModalFooter>
              <Button color="success" onClick={() => this.toggle('noConfigOrDllFound')}> OK </Button>
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
                  this.setState({activeSubform: 'reference'});
                }}>

            <FormGroup className="input-form">

              <div className="row">
                <div className="col-sm-3 input-subform button-subform">
                  <Button color="success"
                          disabled={this.state.selectedPumps.length === 0}
                  > Reference Move </Button>
                  <FormText>Calibrate the selected pumps.</FormText>
                  <Modal isOpen={this.state.modal['referenceMove']} className={this.props.className}>
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
                <div className="col-sm-3"></div>
                <div className="col-sm-3"></div>
                <div className="col-sm-3"></div>
              </div>
            </FormGroup>
          </Form>

          {/*FILL FORM*/}
          <Form method="post"
                onSubmit={(e) => {
                  e.preventDefault();
                  this.toggle('fill');
                  this.setState({activeSubform: 'fill'})
                }}>

            <FormGroup className="input-form">
              <div className="row">

                <div className="col-sm-3 input-subform button-subform">
                  <Button color="success"
                          disabled={this.state.selectedPumps.length === 0}
                  > Fill Cycle </Button>
                  <FormText>Fill & empty the syringe multiple times. Ends with a filled syringe.</FormText>

                  <Modal isOpen={this.state.modal['fill']} className={this.props.className}>
                    <ModalHeader>Fill</ModalHeader>
                    <ModalBody>
                      Insert the inlet tube into the stimulus reservoir and
                      detach the spray head if repeating the fill procedure.
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success" onClick={() => this.handlePumpOperation('fill')}> Continue </Button>
                      <Button color="danger" onClick={() => this.toggle('fill')}> Cancel </Button>
                    </ModalFooter>
                  </Modal>
                </div>


                <div className="col-sm-3 input-subform nrep-subform">
                  <Input type="number"
                         className="foo"
                         value={this.state.repetitions['fill']}
                         name="repetitions"
                         min="1"
                         placeholder="No. of repetitions."
                         onChange={(e) => this.handleStateChange('repetitions', 'fill', e.target.value)}
                         onBlur={() => this.checkRepetitionInput('fill')}
                         required/>
                </div>

                <div className="col-sm-3 input-subform volume-subform"></div>

                <div className="col-sm-3 input-subform flowrate-subform">
                  <Input type="number"
                         value={this.state.flowRate['fill']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="flowRate"
                         min="0"
                         max={this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm('fill')}
                         placeholder="Flow rate."
                         onChange={(e) => this.handleStateChange('flowRate', 'fill', e.target.value)}
                         onBlur={() => this.checkFlowRateInput('fill')}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit['fill']}
                         onBlur={() => this.checkFlowRateInput('fill')}
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
                  this.setState({activeSubform: 'empty'})
                }}>

            <FormGroup className="input-form">
              <div className="row">

                <div className="col-sm-3 input-subform button-subform">
                  <Button color="success"
                          disabled={this.state.selectedPumps.length === 0}
                  > Empty Cycle </Button>
                  <FormText>Empty & fill the syringe multiple times. Ends with an empty syringe.</FormText>

                  <Modal isOpen={this.state.modal['empty']} className={this.props.className}>
                    <ModalHeader>Empty</ModalHeader>
                    <ModalBody>
                      Remove the inlet tube from the stimulus reservoir and
                      detach the spray head from the mouthpiece.
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success" onClick={() => this.handlePumpOperation('empty')}> Continue </Button>
                      <Button color="danger" onClick={() => this.toggle('empty')}> Cancel </Button>
                    </ModalFooter>
                  </Modal>
                </div>


                <div className="col-sm-3 input-subform nrep-subform">
                  <Input type="number"
                         value={this.state.repetitions['empty']}
                         name="repetitions"
                         min="1"
                         placeholder="No. of repetitions."
                         onChange={(e) => this.handleStateChange('repetitions', 'empty', e.target.value)}
                         onBlur={() => this.checkRepetitionInput('empty')}
                         required/>
                </div>


                <div className="col-sm-3 input-subform volume-subform"></div>


                <div className="col-sm-3 input-subform flowrate-subform">
                  <Input type="number"
                         value={this.state.flowRate['empty']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="flowRate"
                         min="0"
                         max={this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm('empty')}
                         placeholder="Flow rate."
                         onChange={(e) => this.handleStateChange('flowRate', 'empty', e.target.value)}
                         onBlur={() => this.checkFlowRateInput('empty')}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit['empty']}
                         onBlur={() => this.checkFlowRateInput('empty')}
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
                  this.setState({activeSubform: 'bubble'})
                }}>

            <FormGroup className="input-form">
              <div className="row">

                <div className="col-sm-3 input-subform button-subform">
                  <Button color="success"
                          disabled={this.state.selectedPumps.length === 0}
                  > Bubble Cycle </Button>
                  <FormText>Guided procedure to remove air bubbles trapped in the syringe. Ends with a filled syringe.</FormText>
                  <Modal isOpen={this.state.modal['bubbleCycleStart']}
                         className={this.props.className}>
                    <ModalHeader>Bubble Cycle</ModalHeader>
                    <ModalBody>
                      Insert the inlet tube into the stimulus reservoir.
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        color="success"
                        onClick={() => this.handlePumpOperation('bubbleCycle')}> Continue </Button>
                      <Button
                        color="danger"
                        onClick={() => this.toggle('bubbleCycleStart')}> Cancel </Button>
                    </ModalFooter>
                  </Modal>
                  <Modal isOpen={this.state.modal['bubbleCycleMiddle']}
                         className={this.props.className}>
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
                         className={this.props.className}>
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


                <div className="col-sm-3 input-subform nrep-subform"></div>
                <div className="col-sm-3 input-subform volume-subform"></div>


                <div className="col-sm-3 input-subform flowrate-subform">
                  <Input type="number"
                         value={this.state.flowRate['bubble']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="flowRate"
                         min="0"
                         max={this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm('bubble')}
                         placeholder="Flow rate."
                         onChange={(e) => this.handleStateChange('flowRate', 'bubble', e.target.value)}
                         onBlur={() => this.checkFlowRateInput('bubble')}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit['bubble']}
                         onBlur={() => this.checkFlowRateInput('bubble')}
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
                  this.setState({activeSubform: 'rinse'})
                }}>

            <FormGroup className="input-form">
              <div className="row">

                <div className="col-sm-3 input-subform button-subform">
                  <Button color="success"
                          disabled={this.state.selectedPumps.length === 0}
                  > Rinse Cycle </Button>
                  <FormText>Empty & fill the syringe multiple times. Ends with an empty syringe.</FormText>
                  <Modal isOpen={this.state.modal['rinse']} className={this.props.className}>
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


                <div className="col-sm-3 input-subform nrep-subform">
                  <Input type="number"
                         value={this.state.repetitions['rinse']}
                         name="repetitions"
                         min="1"
                         placeholder="No. of repetitions."
                         onChange={(e) => this.handleStateChange('repetitions', 'rinse', e.target.value)}
                         onBlur={() => this.checkRepetitionInput('rinse')}
                         required/>
                </div>


                <div className="col-sm-3 input-subform volume-subform"></div>


                <div className="col-sm-3 input-subform flowrate-subform">
                  <Input type="number"
                         value={this.state.flowRate['rinse']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="flowRate"
                         min="0"
                         max={this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm('rinse')}
                         placeholder="Flow rate."
                         onBlur={() => this.checkFlowRateInput('rinse')}
                         onChange={(e) => this.handleStateChange('flowRate', 'rinse', e.target.value)}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit['rinse']}
                         onBlur={() => this.checkFlowRateInput('rinse')}
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
                <div className="col-sm-3 input-subform button-subform">
                  <Button color="success"
                          disabled={this.state.selectedPumps.length === 0}
                  > Target Volume </Button>
                  <FormText>Set target volume of a syringe.</FormText>
                </div>


                <div className="col-sm-3 input-subform nrep-subform"></div>


                <div className="col-sm-3 input-subform volume-subform">
                  <Input type="number"
                         value={this.state.targetVolume['targetVolume']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="targetVolume"
                         min="0"
                         max={this.computeSmallestSyringeVolumeMilliLitres('targetVolume')}
                         placeholder="Target volume."
                         onChange={(e) => this.handleStateChange('targetVolume', 'targetVolume', e.target.value)}
                         onBlur={() => this.checkTargetVolumeInput('targetVolume')}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.volumeUnit['targetVolume']}
                         onBlur={() => this.checkTargetVolumeInput('targetVolume')}
                         onChange={(e) => this.handleStateChange('volumeUnit', 'targetVolume', e.target.value)}>
                    <option value="mL">mL</option>
                    <option value="cL">cL</option>
                  </Input>
                </div>


                <div className="col-sm-3 input-subform flowrate-subform">
                  <Input type="number"
                         value={this.state.flowRate['targetVolume']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="flowRate"
                         min="0"
                         max={this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm('targetVolume')}
                         placeholder="Flow rate."
                         onChange={(e) => this.handleStateChange('flowRate', 'targetVolume', e.target.value)}
                         onBlur={() => this.checkFlowRateInput('targetVolume')}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit['targetVolume']}
                         onBlur={() => this.checkFlowRateInput('targetVolume')}
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


class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          {/*<img src={logo} className="App-logo" alt="logo" />*/}
          <h1 className="App-title">pyqmix-web</h1>
        </header>
        {/*<p className="App-intro">*/}
        {/*</p>*/}
        <div className="entire-pump-form">
        <PumpForm/>
        </div>
      </div>
    );
  }
}

export default App;

