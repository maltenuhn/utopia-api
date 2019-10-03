import * as React from "react";
import { render } from "react-dom";
import { View } from "./primitives/view";

import "./styles.css";

function App() {
  return (
    <div className="App">
      <View
        layout={{ top: 0, width: 375, left: 0, height: 815 }}
        style={{
          backgroundColor: "hsl(0,0%,98%)",
          border: "1px solid hsl(0,0%,95%)"
        }}
      >
        <View
          layout={{ top: 0, left: 0, right: 0, height: 35 }}
          style={{
            backgroundColor: "hsl(0,0%,96%)"
          }}
        />
        <View
          layout={{ bottom: 0, left: 0, right: 0, height: 35 }}
          style={{
            backgroundColor: "hsl(0,0%,96%)"
          }}
        />
      </View>
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
