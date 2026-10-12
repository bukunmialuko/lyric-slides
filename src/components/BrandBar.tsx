import logo from "../assets/harvesters-logo-white.png";

export function BrandBar() {
  return (
    <div className="brandbar">
      <div className="brandin">
        <img className="logo" src={logo} alt="Harvesters International Christian Centre" />
        <div className="campus">
          <span className="c1">Birmingham</span>
          <span className="c2">Technical team · Sunday service 10:30 AM</span>
        </div>
        <span className="app">ProPresenter lyrics</span>
      </div>
    </div>
  );
}
