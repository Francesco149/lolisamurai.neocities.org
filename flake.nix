{
  description = "lolisamurai.neocities.org - markdown -> static site (build with `nix run`)";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f:
        nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      # Interactive shell with the toolchain on PATH:  nix develop
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [ pkgs.nodejs_22 pkgs.neocities ];
          shellHook = ''
            echo "lolisamurai.neocities.org  ::  node $(node --version)"
            echo "  build:    node build.mjs            (content/ -> public/)"
            echo "  publish:  neocities push --prune public"
          '';
        };
      });

      apps = forAllSystems (pkgs:
        let
          # build content/ -> public/   (run from the repo root)
          build = pkgs.writeShellApplication {
            name = "build";
            runtimeInputs = [ pkgs.nodejs_22 ];
            text = ''
              node build.mjs
              echo "built -> $PWD/public   (open public/index.html to inspect)"
            '';
          };
          # build, then push public/ to Neocities   (run from the repo root)
          publish = pkgs.writeShellApplication {
            name = "publish";
            runtimeInputs = [ pkgs.nodejs_22 pkgs.neocities ];
            text = ''
              if [ -z "''${NEOCITIES_API_KEY:-}" ]; then
                echo "note: NEOCITIES_API_KEY not set; using any saved 'neocities' login (~/.neocities/config)." >&2
                echo "      set one with:  export NEOCITIES_API_KEY=...   (neocities.org -> Settings -> Manage Site -> API key)" >&2
              fi
              node build.mjs
              neocities push --prune public
            '';
          };
        in
        {
          default = { type = "app"; program = "${build}/bin/build"; meta.description = "Build content/ -> public/"; };
          build = { type = "app"; program = "${build}/bin/build"; meta.description = "Build content/ -> public/"; };
          publish = { type = "app"; program = "${publish}/bin/publish"; meta.description = "Build, then push public/ to Neocities (needs NEOCITIES_API_KEY)"; };
        });
    };
}
