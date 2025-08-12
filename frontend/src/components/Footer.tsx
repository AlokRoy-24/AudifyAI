import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Github, Linkedin, Twitter, ExternalLink } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="AudifyAI" className="w-8 h-8" />
              <span className="text-xl font-bold text-foreground">AudifyAI</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Revolutionizing call analysis with AI-powered audit solutions. 
              Get instant insights and comprehensive reports on your calls.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <Github className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <Linkedin className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <Twitter className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <a 
                  href="#process" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a 
                  href="#features" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Features
                </a>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Solutions</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Call Center Audits
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Sales Call Analysis
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Customer Service Quality
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Compliance Monitoring
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">hello@audifyai.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Mumbai, Maharashtra, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © {currentYear} AudifyAI. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a 
                href="#" 
                className="hover:text-primary transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="#" 
                className="hover:text-primary transition-colors"
              >
                Terms of Service
              </a>
              <a 
                href="#" 
                className="hover:text-primary transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>

          {/* Beta Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              🧪 Beta Version - We're experimenting to better serve your needs. 
              <a 
                href="/contact" 
                className="text-primary hover:underline ml-1"
              >
                Contact us
              </a> 
              {' '} to personalize for your use case.
            </p>
          </div>

          {/* Made with Love */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Made by alumni of{" "}
              <a 
                href="https://www.iitkgp.ac.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center"
              >
                IIT Kharagpur
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
