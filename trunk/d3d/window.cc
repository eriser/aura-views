#include "window.h"

namespace {

static const wchar_t* kWindowClass = L"D3DTestWindow";
static const wchar_t* kWindowTitle = L"D3DTestWindow";

}  // namespace

////////////////////////////////////////////////////////////////////////////////
// Window, public:

Window::Window() : hwnd_(NULL) {
  RegisterClazz();
}

Window::~Window() {
}

void Window::Create() {
  CreateWindow(kWindowClass, kWindowTitle, WS_OVERLAPPEDWINDOW,
      100, 100, 600, 500, NULL, NULL,
      NULL, this);
}

void Window::Show(int show_command) {
  ShowWindow(hwnd_, SW_SHOW);
}

////////////////////////////////////////////////////////////////////////////////
// Window, private:

void Window::OnPaint() {
}

void Window::Resize(int width, int height) {
  DXGI_SWAP_CHAIN_DESC swap_chain_desc = {0};
  swap_chain_desc.BufferCount = 1;
  swap_chain_desc.BufferDesc.Width = width;
  swap_chain_desc.BufferDesc.Height = height;
  swap_chain_desc.BufferDesc.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
  swap_chain_desc.BufferDesc.RefreshRate.Numerator = 60;
  swap_chain_desc.BufferDesc.RefreshRate.Denominator = 1;
  swap_chain_desc.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
  swap_chain_desc.OutputWindow = hwnd_;
  swap_chain_desc.SampleDesc.Count = 1;
  swap_chain_desc.SampleDesc.Quality = 0;
  swap_chain_desc.Windowed = 1;

  HRESULT hr = D3D10CreateDeviceAndSwapChain(NULL,
                                             D3D10_DRIVER_TYPE_HARDWARE,
                                             NULL,
                                             0,
                                             D3D10_SDK_VERSION,
                                             &swap_chain_desc,
                                             swap_chain_.Receive(),
                                             device_.Receive());
  ScopedComPtr<ID3D10Texture2D> back_buffer;
  hr = swap_chain_->GetBuffer(0, __uuidof(ID3D10Texture2D),
                              reinterpret_cast<void**>(back_buffer.Receive()));
  hr = device_->CreateRenderTargetView(back_buffer, NULL,
                                       render_target_view_.Receive());
  device_->OMSetRenderTargets(1, render_target_view_.Receive(), NULL);

  D3D10_VIEWPORT viewport;
  viewport.Width = width;
  viewport.Height = height;
  viewport.MinDepth = 0.0f;
  viewport.MaxDepth = 1.0f;
  viewport.TopLeftX = 0;
  viewport.TopLeftY = 0;
  device_->RSSetViewports(1, &viewport);
}

// static
LRESULT CALLBACK Window::WndProc(HWND hwnd,
                                 UINT message,
                                 WPARAM w_param,
                                 LPARAM l_param) {
  if (message == WM_NCCREATE) {
    CREATESTRUCT* cs = reinterpret_cast<CREATESTRUCT*>(l_param);
    Window* window = reinterpret_cast<Window*>(cs->lpCreateParams);
    SetWindowLongPtr(hwnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(window));
    window->hwnd_ = hwnd;
    return TRUE;
  }

  Window* window = reinterpret_cast<Window*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));
  if (!window)
    return 0;

  switch (message) {
    case WM_CREATE:
      break;
    case WM_ERASEBKGND:
      return 1;
      /*
    case WM_PAINT:
      window->OnPaint();
      return 0;
    case WM_NCPAINT:
      break;
    case WM_NCACTIVATE:
      break;
    case WM_NCCALCSIZE:
      break;
    case WM_NCHITTEST:
      break;
    case WM_RBUTTONDOWN:
      break;
    case 0x31E: // WM_DWMCOMPOSITIONCHANGED
      break;
    case 0xAE: // WM_NCUAHDRAWCAPTION
    case 0xAF: // WM_NCUAHDRAWFRAME
      break;
    case WM_WINDOWPOSCHANGED:
      break;
      */
    case WM_DESTROY:
      PostQuitMessage(0);
      break;
    default:
      return DefWindowProc(hwnd, message, w_param, l_param);
  }

  return 0;
}

// static
void Window::RegisterClazz() {
  static bool registered = false;
  if (registered)
    return;
  WNDCLASSEX wcex = {0};
  wcex.cbSize = sizeof(wcex);
  wcex.style = CS_HREDRAW | CS_VREDRAW;
  wcex.lpfnWndProc = &Window::WndProc;
  wcex.hInstance = NULL;
  wcex.lpszClassName = kWindowClass;
  ATOM g = RegisterClassEx(&wcex);
  registered = true;
}

