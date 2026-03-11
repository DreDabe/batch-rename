// vite.config.ts
import { defineConfig } from "file:///D:/Program/Project/Project/batch-rename/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Program/Project/Project/batch-rename/node_modules/@vitejs/plugin-react/dist/index.js";
import electron from "file:///D:/Program/Project/Project/batch-rename/node_modules/vite-plugin-electron/dist/index.mjs";
import renderer from "file:///D:/Program/Project/Project/batch-rename/node_modules/vite-plugin-electron-renderer/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "D:\\Program\\Project\\Project\\batch-rename";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: "electron/main.ts",
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: ["electron"]
            }
          }
        }
      },
      {
        entry: "electron/preload.ts",
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: ["electron"]
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    outDir: "dist"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQcm9ncmFtXFxcXFByb2plY3RcXFxcUHJvamVjdFxcXFxiYXRjaC1yZW5hbWVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXFByb2dyYW1cXFxcUHJvamVjdFxcXFxQcm9qZWN0XFxcXGJhdGNoLXJlbmFtZVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovUHJvZ3JhbS9Qcm9qZWN0L1Byb2plY3QvYmF0Y2gtcmVuYW1lL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgZWxlY3Ryb24gZnJvbSAndml0ZS1wbHVnaW4tZWxlY3Ryb24nXHJcbmltcG9ydCByZW5kZXJlciBmcm9tICd2aXRlLXBsdWdpbi1lbGVjdHJvbi1yZW5kZXJlcidcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3QoKSxcclxuICAgIGVsZWN0cm9uKFtcclxuICAgICAge1xyXG4gICAgICAgIGVudHJ5OiAnZWxlY3Ryb24vbWFpbi50cycsXHJcbiAgICAgICAgb25zdGFydChvcHRpb25zKSB7XHJcbiAgICAgICAgICBvcHRpb25zLnN0YXJ0dXAoKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdml0ZToge1xyXG4gICAgICAgICAgYnVpbGQ6IHtcclxuICAgICAgICAgICAgb3V0RGlyOiAnZGlzdC1lbGVjdHJvbicsXHJcbiAgICAgICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBleHRlcm5hbDogWydlbGVjdHJvbiddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBlbnRyeTogJ2VsZWN0cm9uL3ByZWxvYWQudHMnLFxyXG4gICAgICAgIG9uc3RhcnQob3B0aW9ucykge1xyXG4gICAgICAgICAgb3B0aW9ucy5yZWxvYWQoKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdml0ZToge1xyXG4gICAgICAgICAgYnVpbGQ6IHtcclxuICAgICAgICAgICAgb3V0RGlyOiAnZGlzdC1lbGVjdHJvbicsXHJcbiAgICAgICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBleHRlcm5hbDogWydlbGVjdHJvbiddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIF0pLFxyXG4gICAgcmVuZGVyZXIoKVxyXG4gIF0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIG91dERpcjogJ2Rpc3QnXHJcbiAgfVxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlULFNBQVMsb0JBQW9CO0FBQzlVLE9BQU8sV0FBVztBQUNsQixPQUFPLGNBQWM7QUFDckIsT0FBTyxjQUFjO0FBQ3JCLE9BQU8sVUFBVTtBQUpqQixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixTQUFTO0FBQUEsTUFDUDtBQUFBLFFBQ0UsT0FBTztBQUFBLFFBQ1AsUUFBUSxTQUFTO0FBQ2Ysa0JBQVEsUUFBUTtBQUFBLFFBQ2xCO0FBQUEsUUFDQSxNQUFNO0FBQUEsVUFDSixPQUFPO0FBQUEsWUFDTCxRQUFRO0FBQUEsWUFDUixlQUFlO0FBQUEsY0FDYixVQUFVLENBQUMsVUFBVTtBQUFBLFlBQ3ZCO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQTtBQUFBLFFBQ0UsT0FBTztBQUFBLFFBQ1AsUUFBUSxTQUFTO0FBQ2Ysa0JBQVEsT0FBTztBQUFBLFFBQ2pCO0FBQUEsUUFDQSxNQUFNO0FBQUEsVUFDSixPQUFPO0FBQUEsWUFDTCxRQUFRO0FBQUEsWUFDUixlQUFlO0FBQUEsY0FDYixVQUFVLENBQUMsVUFBVTtBQUFBLFlBQ3ZCO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxTQUFTO0FBQUEsRUFDWDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLEVBQ1Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
