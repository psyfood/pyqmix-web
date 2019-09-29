import {Button, ButtonGroup} from "reactstrap";
import React, {Component} from "react";


class PumpSelectionButtonGroup extends Component {
  render = () => {
    return (
      <ButtonGroup>
        {this.props.pumpIds.map(pumpId =>
            <Button color={"primary"}
                    key={pumpId}
                    onClick={() => this.props.onPumpSelection(pumpId)}
                    active={this.props.selectedPumps.includes(pumpId)}>
              {'Pump ' + pumpId.toString()}
            </Button>)
        }
      </ButtonGroup>
    )
  }
}

export default PumpSelectionButtonGroup;
