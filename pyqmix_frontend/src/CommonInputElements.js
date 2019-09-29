import React, {Component} from "react";
import {Input} from "reactstrap";

export class RepetitionsInput extends Component {
  render = () => {
    return <Input type="number"
                  value={this.props.value}
                  onChange={this.props.onChange}
                  onBlur={this.props.onBlur}
                  min="1"
                  placeholder="No. of repetitions."
                  disabled={this.props.disabled}
                  required/>
  }
}

export class FlowRateInput extends Component {
  render = () => {
    return <Input type="number"
                  value={this.props.value}
                  onChange={this.props.onChange}
                  onBlur={this.props.onBlur}
                  pattern="\d+((\.)\d+)?"
                  step="any"
                  min="0"
                  max={this.props.max}
                  placeholder="Flow rate."
                  disabled={this.props.disabled}
                  required/>
  }
}

export class FlowUnitInput extends Component {
  render = () => {
    return (
      <Input
        type="select"
        defaultValue={this.props.defaultValue}
        onChange={this.props.onChange}
        onBlur={this.props.onBlur}
        disabled={this.props.disabled}
      >
        <option value="mL/s">mL/s</option>
        <option value="mL/min">mL/min</option>
        <option value="cL/s">cL/s</option>
        <option value="cL/min">cL/min</option>
      </Input>
    )
  }
}

export class TargetVolumeInput extends Component {
  render = () => {
    return <Input type="number"
                  value={this.props.value}
                  onChange={this.props.onChange}
                  onBlur={this.props.onBlur}
                  pattern="\d+((\.)\d+)?"
                  step="any"
                  min="0"
                  max={this.props.max}
                  placeholder="Target volume."
                  disabled={this.props.disabled}
                  required/>
  }
}

export class VolumeUnitInput extends Component {
  render = () => {
    return (
      <Input
        type="select"
        defaultValue={this.props.defaultValue}
        onChange={this.props.onChange}
        onBlur={this.props.onBlur}
        disabled={this.props.disabled}
      >
        <option value="mL">mL</option>
        <option value="cL">cL</option>
      </Input>
    )
  }
}
