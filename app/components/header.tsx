import InfoOutlineIcon from "@mui/icons-material/InfoOutline";
export function Header() {
  return (
    <header className="header">
      <div className="contributors-container">
        <button className="contributors-button" aria-haspopup="true">
          <InfoOutlineIcon fontSize="large" />
        </button>
        <div className="contributors-popup">
          <p>Dung Hai Dinh*, Dat Thanh Tang**</p>
          <p>Thien Duc Huu Nguyen**, Ngoc Hong Tran**</p>
          <p>*Business Information Systems, Vietnamese-German University</p>
          <p>**Computer Science, Vietnamese-German University</p>
        </div>
      </div>

      <h1 className="title">Diverty</h1>
      <img src="/VGU-logo.png" alt="VGU Logo" className="logo" />
    </header>
  );
}
