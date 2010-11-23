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

  void OnPaint();
 private:
  void OnCreate();
  void OnSize(int width, int height);

  void CreateSwapChainForDevice(int width, int height);

  void HandleFailure(HRESULT hr);

  static LRESULT CALLBACK WndProc(HWND hwnd,
                                  UINT message,
                                  WPARAM w_param,
                                  LPARAM l_param);

  static void RegisterClazz();

  HWND hwnd_;

  ScopedComPtr<ID3D10Device> device_;
  ScopedComPtr<IDXGISwapChain> swap_chain_;
  ScopedComPtr<ID3D10RenderTargetView> render_target_view_;
  ScopedComPtr<ID3D10Effect> effect_;
  ID3D10EffectTechnique* effect_technique_;
  ScopedComPtr<ID3D10InputLayout> vertex_layout_;
  ScopedComPtr<ID3D10Buffer> vertex_buffer_;
};

#endif  // WINDOW_H_

