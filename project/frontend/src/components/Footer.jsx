export default function Footer() {
  return ( 
    <footer className="footer">
      <div className="footer__inner">
        <p>AI Interview Coach &copy; {new Date().getFullYear()}</p>
        <p className="footer__note">Built with React, Flask & Google Gemini</p>
      </div>
    </footer>
  )
}
