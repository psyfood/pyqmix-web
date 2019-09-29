import React, {Component} from 'react';
import PumpForm from "./PumpForm";
import Outro from "./Outro";

import './App.css';


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
