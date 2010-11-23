#include <windows.h>
#include <d3d10.h>
#include <d3dx10.h>
#include <dwmapi.h>

#include "scoped_comptr.h"
#include "window.h"

int WINAPI WinMain(HINSTANCE instance, HINSTANCE, LPSTR, int show_command) {
  Window window;
  window.Create();
  window.Show(show_command);

  MSG msg = {0};
  while (WM_QUIT != msg.message) {
    if (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
      TranslateMessage(&msg);
      DispatchMessage(&msg);
    } else {
      window.OnPaint();
    }
  }
  return static_cast<int>(msg.wParam);
}

