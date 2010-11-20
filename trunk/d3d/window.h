#ifndef WINDOW_H_
#define WINDOW_H_

#include <windows.h>
#include <d3d10.h>
#include <d3dx10.h>

#include "scoped_comptr.h"

class Window {
 public:
   Window();
  ~Window();

  void Create();

  void Show(int show_command);

  HWND hwnd() const { return hwnd_; }

 private:
  void OnPaint();
  void OnSize(int width, int height);

  static LRESULT CALLBACK WndProc(HWND hwnd,
                                  UINT message,
                                  WPARAM w_param,
                                  LPARAM l_param);

  static void RegisterClazz();

  HWND hwnd_;

  ScopedComPtr<ID3D10Device> device_;
  ScopedComPtr<IDXGISwapChain> swap_chain_;
  ScopedComPtr<ID3D10RenderTargetView> render_target_view_;
};

#endif  // WINDOW_H_

