import React, { useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    alert('Thank you for contacting us! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="contact-page">
      <Header />
      <div className="page-content">
        <div className="contact-hero">
          <div className="container">
            <h1>Get in Touch</h1>
            <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          </div>
        </div>
        
        <div className="contact-content">
          <div className="container">
            <div className="contact-grid">
              <div className="contact-info">
                <h2>Contact Information</h2>
                
                <div className="contact-item">
                  <h3>📧 Email Us</h3>
                  <p>support@jobconnect.com</p>
                  <p>careers@jobconnect.com</p>
                </div>
                
                <div className="contact-item">
                  <h3>📞 Call Us</h3>
                  <p>+1 (555) 123-4567</p>
                  <p>Mon - Fri: 9:00 AM - 6:00 PM</p>
                </div>
                
                <div className="contact-item">
                  <h3>🏢 Visit Us</h3>
                  <p>123 Business Street<br/>
                     Suite 100<br/>
                     Tech City, TC 12345</p>
                </div>
                
                <div className="contact-item">
                  <h3>🌐 Follow Us</h3>
                  <div className="social-links">
                    <a href="#" className="social-link">LinkedIn</a>
                    <a href="#" className="social-link">Twitter</a>
                    <a href="#" className="social-link">Facebook</a>
                  </div>
                </div>
              </div>
              
              <div className="contact-form-section">
                <h2>Send us a Message</h2>
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="5"
                      required
                    />
                  </div>
                  
                  <button type="submit" className="submit-btn">
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
