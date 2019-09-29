import {Button, Form, FormGroup, FormText, Col, Row} from "reactstrap";
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
          <Row>
            <Col sm className="input-subform button-subform">
              <Button color="success"
                      disabled={this.props.disabled}
              > Target Volume </Button>
              <FormText>Set target volume of a syringe.</FormText>
            </Col>

            {/* Just here to ensure correct grid spacing */}
            <Col sm className="input-subform"></Col>

            <Col sm className="input-subform volume-subform">
              <TargetVolumeInput value={this.props.targetVolume}
                                 max={this.props.targetVolumeMax}
                                 onChange={this.props.onTargetVolumeChange}
                                 onBlur={this.props.checkTargetVolumeInput}
                                 disabled={this.props.disabled}
              />
              <VolumeUnitInput defaultValue={this.props.volumeUnit}
                               onChange={this.props.onVolumeUnitChange}
                               onBlur={this.props.checkTargetVolumeInput}
                               disabled={this.props.disabled}
              />
            </Col>

            <Col sm className="input-subform flowrate-subform">
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
            </Col>
          </Row>
        </FormGroup>
      </Form>
    )
  }
}

export default TargetVolumeForm;
