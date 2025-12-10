{
  description = "Jekyll + Tailwind CSS development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Ruby and Jekyll dependencies
            ruby_3_3
            
            # Node.js and npm for Tailwind CSS
            nodejs_20
            
            # Build tools that Jekyll might need
            gcc
            gnumake
            
            # Git (useful for GitHub Pages)
            git
          ];

          shellHook = ''
            echo "Jekyll + Tailwind CSS development environment"
            echo "==========================================="
            echo ""
            echo "Available commands:"
            echo "  gem install bundler:2.3.5  - Install specific Bundler version (first time)"
            echo "  bundle install             - Install Ruby dependencies"
            echo "  npm install                - Install Node dependencies"
            echo "  npm run dev:css            - Watch and compile Tailwind CSS"
            echo "  npm run dev:jekyll         - Run Jekyll development server"
            echo "  npm run build:css          - Build minified Tailwind CSS"
            echo ""
            echo "To run both servers concurrently, open two terminals:"
            echo "  Terminal 1: npm run dev:css"
            echo "  Terminal 2: npm run dev:jekyll"
            echo ""
            
            # Set up Ruby gem path in the project directory
            export GEM_HOME="$PWD/.gem"
            export GEM_PATH="$GEM_HOME"
            export PATH="$GEM_HOME/bin:$PATH"
            
            # Install specific bundler version if not already installed
            if [ ! -f "$GEM_HOME/gems/bundler-2.3.5/lib/bundler.rb" ]; then
              echo "Installing Bundler 2.3.5..."
              gem install bundler:2.3.5 --no-document
            fi
            
            # Ensure bundle is available
            if [ ! -f "Gemfile" ]; then
              echo "⚠️  Warning: No Gemfile found. You may need to create one."
            fi
          '';
        };
      }
    );
}
