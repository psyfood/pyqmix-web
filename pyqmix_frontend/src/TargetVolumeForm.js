import {Button, Form, FormGroup, FormText} from "reactstrap";
import {FlowRateInput, FlowUnitInput, TargetVolumeInput, VolumeUnitInput} from "./CommonInputElements";
import React, {Component} from "react";


class TargetVolumeForm extends Component {
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.handlePumpOperation('targetVolume');
  };

  render = () => {
    return (
      <Form method="post"
            onSubmit={this.handleSubmit}>

        <FormGroup className="input-form">
          <div className="row">
            <div className="col-sm input-subform button-subform">
              <Button color="success"
                      disabled={this.props.disabled}
              > Target Volume </Button>
              <FormText>Set target volume of a syringe.</FormText>
            </div>

            {/* Just here to ensure correct grid spacing */}
            <div className="col-sm input-subform"></div>

            <div className="col-sm input-subform volume-subform">
              <TargetVolumeInput value={this.props.targetVolume}
                                 max={this.props.volumeMax}
                                 onChange={this.props.onTargetVolumeChange}
                                 onBlur={this.props.checkTargetVolumeInput}
                                 disabled={this.props.disabled}
              />
              <VolumeUnitInput defaultValue={this.props.volumeUnit}
                               onChange={this.props.onVolumeUnitChange}
                               onBlur={this.props.checkTargetVolumeInput}
                               disabled={this.props.disabled}
              />
            </div>

            <div className="col-sm input-subform flowrate-subform">
              <FlowRateInput
                 value={this.props.flowRate}
                 max={this.props.flowRateMax}
                 onChange={this.props.onFlowRateChange}
                 onBlur={this.props.checkFlowRateInput}
                 disabled={this.props.disabled}
              />
              <FlowUnitInput defaultValue={this.props.flowUnit}
                             onChange={this.props.onFlowUnitChange}
                             onBlur={this.props.checkFlowRateInput}
                             disabled={this.props.disabled}
              />
            </div>
          </div>
        </FormGroup>
      </Form>
    )
  }
}

export default TargetVolumeForm;
