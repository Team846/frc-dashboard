import React from 'react';
import logo from './logo.svg';
import './App.css';
import Header from "./Header";
import Config from "./Config";
import NetworkTables from "./Networktables";

function App() {
    const [isConnected, setIsConnected] = React.useState(false);
    const [keys, updateKeys] = React.useState({})

    React.useEffect(() => {
        NetworkTables.addRobotConnectionListener(setIsConnected);
        NetworkTables.addGlobalListener((key, value, isNew) => updateKeys(Object.assign(keys, {[key]:value})));
    }, []);

  return (
    <div className="App">
      <Header connected={true}>
      </Header>
        {isConnected ? <Config keys={keys}/> : null}
      </div>
  );
}

export default App;
