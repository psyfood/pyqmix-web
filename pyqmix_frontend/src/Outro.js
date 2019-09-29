import React, {Component} from "react";


class Outro extends Component {

  state = {
    pyqmixVersion: ""
  };

  componentDidMount() {
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

export default Outro;
