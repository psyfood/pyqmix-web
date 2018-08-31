import React, { Component } from 'react';
import { Button, ButtonGroup, FormGroup, Input, Modal,
  ModalHeader, ModalBody, ModalFooter, Form, Label, FormText} from 'reactstrap';
// import logo from './snake.svg';
import './App.css';

// --- State --- //
class PumpForm extends Component {
  state = {

    // System setup
    webConnectedToPumps: false,  // Does the website think the pumps are connected (based on user-input, not backend)
    isPumpConfigSetUp: false,  // Are the pumps set up in the backend
    userEnteredPumpConfig: false,
    dllFileLocation: "",
    configFileLocation: "",

    // Pumps
    pumps: [],  // Pump parameters received from backend
    selectedPumps: [],  // Pump_ID's selected by user. Defined by index of pumps in state.pumps.

    // Which subform did the user execute
    activeSubform: "",

    // Repetition
    repetitions: {
      'fill': [],
      'empty': [],
      'rinse': []
    },

    // Volume
    targetVolume: {
      'fill': [],
      'bubble': []
    },
    volumeUnit: {
      'fill': "mL",
      'bubble': "mL"
    },

    // Flow
    flowRate: {
      'fill': [],
      'empty': [],
      'bubble': [],
      'rinse': []
    },
    flowUnit: {
      'fill': "mL/s",
      'empty': "mL/s",
      'bubble': "mL/s",
      'rinse': "mL/s"
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
      'locateConfigFiles': false
    },
  };

  // --- Update state by input-fields --- //
  handledllFileLocationChange = (e) => this.setState({dllFileLocation: e.target.value});
  handleConfigFileLocationChange = (e) => this.setState({configFileLocation: e.target.value});
  handleLocatingConfig = () => {
    this.toggle('locateConfigFiles');
    this.setState({userEnteredPumpConfig: !this.state.userEnteredPumpConfig})
  };

  // --- Open and close individual modals --- //
  toggle = (modalType) => {
    let modals = this.state.modal;
    modals[modalType] = !modals[modalType];
    this.setState({modal: modals})
  };

    // --- Set state --- //
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
  handleRepetitionsChange = (formID, e) => {
    let repetitions = this.state.repetitions;
    repetitions[formID] = e.target.value;
    this.setState({repetitions: repetitions});
  };

  getActiveRepetition = (activeSubform) => {
    let repetitions = this.state.repetitions;
    return repetitions[activeSubform];
  };

  checkRepetitionInput = (activeForm) => {
    let repetitions = this.state.repetitions;
    let repetition = repetitions[activeForm];
    if (repetition < 1) {
      repetitions[activeForm] = 1;
      this.setState({repetitions: repetitions});
    }
  };

  // --- Volume --- //
  handleVolumeUnitChange = (formID, e) => {
    let volumeUnits = this.state.volumeUnit;
    volumeUnits[formID] = e.target.value;
    this.setState({volumeUnit: volumeUnits})
  };

  handleTargetVolumeChange = (formID, e) => {
    let targetVolumes = this.state.targetVolume;
    targetVolumes[formID] = e.target.value;
    this.setState({targetVolume: targetVolumes});
  };

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
      let targetVolumes = this.state.targetVolume;
      targetVolumes[activeSubform] = targetVolume;
      this.setState({targetVolume: targetVolumes})
    }
    if (this.computeVolumeMilliLitres(activeSubform) < 0) {
      console.log('Volume cannot be negative. Setting target volume to zero.');
      let targetVolumes = this.state.targetVolume;
      targetVolumes[activeSubform] = 0;
      this.setState({targetVolume: targetVolumes})
    }
  };

  // --- Flow --- //
  handleFlowRateChange = (formID, e) => {
    let flowRates = this.state.flowRate;
    flowRates[formID] = e.target.value;
    this.setState({flowRate: flowRates})
  };

  handleFlowUnitChange = (formID, e) => {
    let flowUnits = this.state.flowUnit;
    flowUnits[formID] = e.target.value;
    this.setState({flowUnit: flowUnits})
  };

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
      let flowRates = this.state.flowRate;
      flowRates[activeSubform] = flowRate;
      this.setState({flowRate: flowRates})
    }
    if (this.computeFlowMilliLitresPerSecond(activeSubform) < 0) {
      console.log('Flow rate cannot be negative. Setting flow rate to zero.');
      let flowRates = this.state.flowRate;
      flowRates[activeSubform] = 0;
      this.setState({flowRate: flowRates})
    }
  };


  // Checks whether the bus is ready to be initialized
  handlePumpConfiguration = async (e) => {
    console.log('Is pump configuration set up already?: ' + this.state.isPumpConfigSetUp);

    // Ask backend whether the pump configuration is set up
    if (this.state.isPumpConfigSetUp === false) {
      await this.getPumpStates()
    }

    // User must set up the pump configuration if it was not set up in the backend
    if (this.state.isPumpConfigSetUp === false && this.state.webConnectedToPumps === false) {
      console.log('Pump configuration was not set up in the backend. User needs to set it up.');

      // modal which asks the user to browse for the config and dll files
      this.toggle('locateConfigFiles');
      await this.waitForConfigFilesToBeSet();

      // Send the files to the backend
      let payload;
      payload = {'dllDir': this.state.dllFileLocation,
        'configDir': this.state.configFileLocation};
      await fetch('/api/config', {
        method: 'put',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }
    this.setState({userEnteredPumpConfig: false}); // reset state
    this.handleConnectPumps();
  };

  // --- Function to wait for user input --- //
  waitForConfigFilesToBeSet = async () => {
    do {
      await new Promise(resolve => setTimeout(resolve, 200));
    } while (this.state.userEnteredPumpConfig === false);
  };

  // Detect pumps and return a list of them
  handleConnectPumps = (e) => {
    this.setState({webConnectedToPumps: !this.state.webConnectedToPumps},
      async () => {
        let payload = {pumpInitiate: this.state.webConnectedToPumps};
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
          await this.getPumpStates(e);
        }
        // Pumps were unsuccesfully connected
        else if (status === false && payload['pumpInitiate']) {
          this.setState({webConnectedToPumps: !this.state.webConnectedToPumps});
          this.setState({selectedPumps: []});
          this.setState({pumps: []});
          // and suggest to the user that paths were wrong or that pumps are not connected
        }
        // Pumps were successfully disconnected
        else if (payload['pumpInitiate'] === false) {
          this.setState({selectedPumps: []});
          this.setState({pumps: []});
        }
      }
    )};

   // --- Reference move --- //
  handleReferenceMove = () => {
    // To remove the modal
    this.toggle('referenceMove');
    this.sendCommmandToPumps('referenceMove');
  };

  // --- Fill pumps --- //
  handleFill = () => {

    // To remove the modal
    this.toggle('fill');

    // Set pumps to fill level
    this.sendCommmandToPumps('fillToLevel');

    // Iterate over repetitions
    let repIndex;
    for (repIndex = 1; repIndex < this.getActiveRepetition(this.state.activeSubform); repIndex++ ) {

      // Empty syringes
      this.sendCommmandToPumps('empty');

      // Set pumps to fill level
      this.sendCommmandToPumps('fillToLevel');
    }
  };

  // --- Empty syringes --- //
  handleEmpty = () => {

    // To remove the modal
    this.toggle('empty');

    // Empty syringes
    this.sendCommmandToPumps('empty');

    // Iterate over repetitions
    let repIndex;
    for (repIndex = 1; repIndex < this.getActiveRepetition(this.state.activeSubform); repIndex++ ) {

      // Set pumps to fill level
      this.sendCommmandToPumps('fill');

      // Empty syringes
      this.sendCommmandToPumps('empty');
    }
  };

  // --- Bubble cycle --- //
  handleBubbleCycleStart = async () => {

    // To remove the modal
    this.toggle('bubbleCycleStart');

    // Fill with stimulus
    this.sendCommmandToPumps('fillToOneThird');

    await this.waitForPumpingToFinish();
    this.toggle('bubbleCycleMiddle');
  };

  handleBubbleCycleMiddle = async () => {

    // To remove the modal
    this.toggle('bubbleCycleMiddle');

    // Fill in air
    this.sendCommmandToPumps('fillToTwoThird');

    // Empty syringes
    this.sendCommmandToPumps('empty');

    await this.waitForPumpingToFinish();
    this.toggle('bubbleCycleEnd');
  };

  handleBubbleCycleEnd = () => {
    this.toggle('bubbleCycleEnd');

    // Fill in stimulus
    this.sendCommmandToPumps('fill');

    // Fill in stimulus
    this.sendCommmandToPumps('empty');

    // Finish up by filling to level
    this.sendCommmandToPumps('fillToLevel');
  };

  // --- Rinse syringes --- //
  handleRinse = () => {

    // To remove the modal
    this.toggle('rinse');

    // Iterate over repetitions
    let repIndex;
    for (repIndex = 0; repIndex < this.getActiveRepetition(this.state.activeSubform); repIndex++ ) {

      // Empty syringes
      this.sendCommmandToPumps('empty');

      // Fill syringes
      this.sendCommmandToPumps('fill');

      // Empty syringes
      this.sendCommmandToPumps('empty');
    }
  };


  // --- Send pump command to backend --- //
  sendCommmandToPumps = async (action) => {
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
      await new Promise(resolve => setTimeout(resolve, 2000));
    } while (this.state.pumps.some(x => x.is_pumping));
  };

  // --- Ask backend for pump state --- //
  getPumpStates = async (e) => {
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
    const json = await response.json();
    return json;
  };

  // --- Render --- //
  render = () => {
    return (
      <div className="pump-form">

        <div className="button-group">
          <Button
            color="success"
            onClick={this.handlePumpConfiguration}>
            {this.state.webConnectedToPumps ? "Disconnect Pumps" : "Detect Pumps"}
          </Button>

          <Modal isOpen={this.state.modal['locateConfigFiles']} className={this.props.className}>
            <ModalHeader>Browse for pump setup files</ModalHeader>
            {/*<ModalBody></ModalBody>*/}
            <ModalHeader>
              <Form method="post"
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}>
                <FormGroup>
                  <Label for="exampleText">config directory</Label>
                  <FormText
                    className="text-modal"
                    color="muted">
                    For example:
                    C:/Users/Public/Documents/QmixElements/.../my_own_config
                  </FormText>
                  <Input
                    className="text-area-input"
                    onChange={this.handleConfigFileLocationChange}
                    placeholder="C:/Users/Public/Documents/QmixElements/Projects/default_project/Configurations/my_own_config"
                    type="textarea"
                    name="text"
                    required
                    id="exampleText" />
                </FormGroup>

                <FormGroup>
                  <Label for="exampleText">dll directory</Label>
                  <FormText
                    className="text-modal"
                    color="muted">
                    For example: <br/>
                    C:/Users/username/AppData/Local/QmixSDK
                  </FormText>
                  <Input
                    className="text-area-input"
                    onChange={this.handledllFileLocationChange}
                    placeholder="C:/Users/au278141/AppData/Local/QmixSDK"
                    name="text"
                    id="exampleText" />
                </FormGroup>
              </Form>
            </ModalHeader>

            <ModalFooter>
              <Button color="success" onClick={this.handleLocatingConfig}> Continue </Button>
              <Button color="danger" onClick={() => this.toggle('locateConfigFiles')}> Cancel </Button>
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
                  <Modal isOpen={this.state.modal['referenceMove']} className={this.props.className}>
                    <ModalHeader >Reference Move</ModalHeader>
                    <ModalBody>
                      Detach all syringes from the pumps before continuing.
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success" onClick={this.handleReferenceMove}> Continue </Button>
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
                  > Fill </Button>
                  <Modal isOpen={this.state.modal['fill']} className={this.props.className}>
                    <ModalHeader>Fill</ModalHeader>
                    <ModalBody>
                      Have you remembered to:
                      1) Insert the inlet tube into the stimulus?
                      2) In case of refill, have you remembered to remove the spray head from the outlet?
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success" onClick={this.handleFill}> Continue </Button>
                      <Button color="danger" onClick={() => this.toggle('fill')}> Cancel </Button>
                    </ModalFooter>
                  </Modal>
                </div>


                <div className="col-sm-3 input-subform nrep-subform">
                  <Input type="number"
                         value={this.state.repetitions['fill']}
                         name="repetitions"
                         min="1"
                         placeholder="No. of repetitions."
                         onChange={(e) => this.handleRepetitionsChange('fill', e)}
                         onBlur={() => this.checkRepetitionInput('fill')}
                         required/>
                </div>

                <div className="col-sm-3 input-subform volume-subform">
                  <Input type="number"
                         value={this.state.targetVolume['fill']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="targetVolume"
                         min="0"
                         max={this.computeSmallestSyringeVolumeMilliLitres('fill')}
                         placeholder="Target volume."
                         onChange={(e) => this.handleTargetVolumeChange('fill', e)}
                         onBlur={() => this.checkTargetVolumeInput('fill')}
                         required/>
                  <Input type="select"
                         name="volumeUnit"
                         defaultValue={this.state.volumeUnit['fill']}
                         onBlur={() => this.checkTargetVolumeInput('fill')}
                         onChange={(e) => this.handleVolumeUnitChange('fill',e)}>
                    <option value="mL">mL</option>
                    <option value="cL">cL</option>
                  </Input>
                </div>


                <div className="col-sm-3 input-subform flowrate-subform">
                  <Input type="number"
                         value={this.state.flowRate['fill']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="flowRate"
                         min="0"
                         max={this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm('fill')}
                         placeholder="Flow rate."
                         onChange={(e) => this.handleFlowRateChange('fill',e)}
                         onBlur={() => this.checkFlowRateInput('fill')}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit}
                         onBlur={() => this.checkFlowRateInput('fill')}
                         onChange={(e) => this.handleFlowUnitChange('fill',e)}>
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
                  > Empty </Button>
                  <Modal isOpen={this.state.modal['empty']} className={this.props.className}>
                    <ModalHeader>Empty</ModalHeader>
                    <ModalBody>
                      Have you remembered to:
                      1) remove the spray head from the outlet?
                      2) remove the inlet tube from the stimulus reservoir?
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success" onClick={this.handleEmpty}> Continue </Button>
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
                         onChange={(e) => this.handleRepetitionsChange('empty',e)}
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
                         onChange={(e) => this.handleFlowRateChange('empty', e)}
                         onBlur={() => this.checkFlowRateInput('empty')}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit['empty']}
                         onBlur={() => this.checkFlowRateInput('empty')}
                         onChange={(e) => this.handleFlowUnitChange('empty', e)}>
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
                  <Modal isOpen={this.state.modal['bubbleCycleStart']} className={this.props.className}>
                    <ModalHeader>Bubble Cycle</ModalHeader>
                    <ModalBody>
                      Insert the inlet tube into the stimulus reservoir.
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success" onClick={this.handleBubbleCycleStart}> Continue </Button>
                      <Button color="danger" onClick={() => this.toggle('bubbleCycleStart')}> Cancel </Button>
                    </ModalFooter>
                  </Modal>
                  <Modal isOpen={this.state.modal['bubbleCycleMiddle']} className={this.props.className}>
                    <ModalHeader>Bubble Cycle</ModalHeader>
                    <ModalBody>
                      Remove the inlet tube from the stimulus reservoir to aspirate air.
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success" onClick={this.handleBubbleCycleMiddle}> Continue </Button>
                      <Button color="danger" onClick={() => this.toggle('bubbleCycleMiddle')}> Cancel </Button>
                    </ModalFooter>
                  </Modal>
                  <Modal isOpen={this.state.modal['bubbleCycleEnd']} className={this.props.className}>
                    <ModalHeader>Bubble Cycle</ModalHeader>
                    <ModalBody>
                      Insert the inlet tube into the stimulus reservoir to aspirate the air in the inlet tube.
                      The bubble will then be removed and the volume set to the chosen target volume.
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success" onClick={this.handleBubbleCycleEnd}> Continue </Button>
                      <Button color="danger" onClick={() => this.toggle('bubbleCycleEnd')}> Cancel </Button>
                    </ModalFooter>
                  </Modal>

                </div>


                <div className="col-sm-3 input-subform nrep-subform"></div>


                <div className="col-sm-3 input-subform volume-subform">
                  <Input type="number"
                         value={this.state.targetVolume['bubble']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="targetVolume"
                         min="0"
                         max={this.computeSmallestSyringeVolumeMilliLitres('bubble')}
                         placeholder="Target volume."
                         onChange={(e) => this.handleTargetVolumeChange('bubble', e)}
                         onBlur={() => this.checkTargetVolumeInput('bubble')}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.volumeUnit['bubble']}
                         onBlur={() => this.checkTargetVolumeInput('bubble')}
                         onChange={(e) => this.handleVolumeUnitChange('bubble', e)}>
                    <option value="mL">mL</option>
                    <option value="cL">cL</option>
                  </Input>
                </div>


                <div className="col-sm-3 input-subform flowrate-subform">
                  <Input type="number"
                         value={this.state.flowRate['bubble']}
                         pattern="\d+((\.)\d+)?"
                         step="any"
                         name="flowRate"
                         min="0"
                         max={this.computeMaximallyAllowedFlowRateUnitAsSpecifiedInForm('bubble')}
                         placeholder="Flow rate."
                         onChange={(e) => this.handleFlowRateChange('bubble', e)}
                         onBlur={() => this.checkFlowRateInput('bubble')}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit['bubble']}
                         onBlur={() => this.checkFlowRateInput('bubble')}
                         onChange={(e) => this.handleFlowUnitChange('bubble', e)}>
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
                  > Rinse </Button>
                  <Modal isOpen={this.state.modal['rinse']} className={this.props.className}>
                    <ModalHeader>Rinse</ModalHeader>
                    <ModalBody>
                      Have you remembered to:
                      1) remove the spray head from the outlet?
                      2) insert the inlet tube into the rinsing fluid?
                    </ModalBody>
                    <ModalFooter>
                      <Button color="success" onClick={this.handleRinse}> Continue </Button>
                      <Button color="danger" onClick={() => this.toggle('rinse')}> Cancel </Button>
                    </ModalFooter>
                  </Modal>
                </div>


                <div className="col-sm-3 input-subform nrep-subform">
                  <Input type="number"
                         value={this.state.repetitions['rinse']}
                         name="repetitions"
                         min="1"
                         placeholder="No. of repetitions."
                         onChange={(e) => this.handleRepetitionsChange('rinse',e)}
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
                         onChange={(e) => this.handleFlowRateChange('rinse', e)}
                         required/>
                  <Input type="select"
                         name="flowUnit"
                         defaultValue={this.state.flowUnit['rinse']}
                         onBlur={() => this.checkFlowRateInput('rinse')}
                         onChange={(e) => this.handleFlowUnitChange('rinse', e)}>
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

