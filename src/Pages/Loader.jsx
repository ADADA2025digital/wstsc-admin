import React from "react";

const Loader = () => {
  return (
    <div className="container-fluid">
      <div className="backdrop">
        <div className="triangle-loader">
          <div className="triangles position-absolute top-50 start-50">
            <div className="tri invert"></div>
            <div className="tri invert"></div>
            <div className="tri"></div>
            <div className="tri invert"></div>
            <div className="tri invert"></div>
            <div className="tri"></div>
            <div className="tri invert"></div>
            <div className="tri"></div>
            <div className="tri invert"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
