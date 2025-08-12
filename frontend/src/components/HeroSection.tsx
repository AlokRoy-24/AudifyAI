import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onTryClick: () => void;
}

const HeroSection = ({ onTryClick }: HeroSectionProps) => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Dynamic Illustration Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="/hero-illustration.png" 
          alt="AI Technology Illustration" 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-auto opacity-10 object-contain"
        />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-glow/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Try our{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              AI driven audit
            </span>{" "}
            for free
          </h1>

          {/* Trust Indicator */}
          <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <p className="text-sm text-primary font-medium bg-primary/10 px-4 py-2 rounded-full inline-block">
              Created by alumni of IIT Kharagpur
            </p>
          </div>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Revolutionize your call analysis with our intelligent audit solution. 
            Get instant insights and comprehensive reports on your calls.
          </p>
          
          {/* Beta Notice */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <p className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg inline-block">
              🧪 Beta Version - We're experimenting to better serve your needs. 
              <span className="text-primary hover:underline cursor-pointer"> Contact us</span> to personalize for your use case.
            </p>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="hero" 
              size="lg" 
              onClick={onTryClick}
              className="text-lg px-8 py-4 h-auto animate-scale-in"
              style={{ animationDelay: '0.2s' }}
            >
              Try Now - It's Free
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Button>

          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Instant results</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Up to 10 calls</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;