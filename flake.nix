{
  description = "Basement Lab - PWA workout tracker";

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
            nodejs_20
            nodePackages.serve
            imagemagick
          ];

          shellHook = ''
            echo "Basement Lab dev shell"
            echo "Commands:"
            echo "  serve .             - Start local server"
            echo "  node tests/validate.js  - Run validation"
          '';
        };

        # Separate shell for E2E tests with Playwright
        devShells.test = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_20
            nodePackages.serve
            playwright-driver.browsers
          ];

          shellHook = ''
            export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
            echo "Basement Lab test shell (with Playwright)"
          '';
        };

        packages.default = pkgs.stdenv.mkDerivation {
          pname = "basement-lab";
          version = "1.0.0";
          src = ./.;

          installPhase = ''
            mkdir -p $out
            cp index.html style.css app.js $out/
            cp -r data $out/
          '';
        };
      });
}
