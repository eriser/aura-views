#include "window.h"

namespace {

static const wchar_t* kWindowClass = L"D3DTestWindow";
static const wchar_t* kWindowTitle = L"D3DTestWindow";

struct SimpleVertex {
  D3DXVECTOR3 Pos;
};

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

void Window::OnCreate() {
  HRESULT hr = D3D10CreateDevice(NULL,
                                 D3D10_DRIVER_TYPE_HARDWARE,
                                 NULL,
                                 0,
                                 D3D10_SDK_VERSION,
                                 device_.Receive());
  HandleFailure(hr);

  hr = D3DX10CreateEffectFromFile(L"content.fx",
                                  NULL,
                                  NULL,
                                  "fx_4_0",
                                  D3D10_SHADER_ENABLE_STRICTNESS,
                                  0,
                                  device_.get(),
                                  NULL,
                                  NULL,
                                  effect_.Receive(),
                                  NULL,
                                  NULL);
  HandleFailure(hr);

  effect_technique_ = effect_->GetTechniqueByName("Render");
  D3D10_INPUT_ELEMENT_DESC layout[] = {
    { "POSITION",
      0,
      DXGI_FORMAT_R32G32B32_FLOAT,
      0,
      0,
      D3D10_INPUT_PER_VERTEX_DATA,
      0 },
  };
  unsigned int elements = sizeof(layout) / sizeof(layout[0]);
  
  D3D10_PASS_DESC pass_desc;
  effect_technique_->GetPassByIndex(0)->GetDesc(&pass_desc);
  hr = device_->CreateInputLayout(layout,
                                  elements,
                                  pass_desc.pIAInputSignature,
                                  pass_desc.IAInputSignatureSize,
                                  vertex_layout_.Receive());
  HandleFailure(hr);

  device_->IASetInputLayout(vertex_layout_.get());

  SimpleVertex vertices[] = {
    D3DXVECTOR3(0.0f, 0.5f, 0.5f),
    D3DXVECTOR3(0.5f, -0.5f, 0.5f),
    D3DXVECTOR3(-0.5f, -0.5f, 0.5f),
  };
  D3D10_BUFFER_DESC buffer_desc;
  buffer_desc.Usage = D3D10_USAGE_DEFAULT;
  buffer_desc.ByteWidth = sizeof(SimpleVertex) * 3;
  buffer_desc.BindFlags = D3D10_BIND_VERTEX_BUFFER;
  buffer_desc.CPUAccessFlags = 0;
  buffer_desc.MiscFlags = 0;
  D3D10_SUBRESOURCE_DATA init_data;
  init_data.pSysMem = vertices;
  hr = device_->CreateBuffer(&buffer_desc, &init_data,
                             vertex_buffer_.Receive());
  HandleFailure(hr);

  unsigned int stride = sizeof(SimpleVertex);
  unsigned int offset = 0;
  device_->IASetVertexBuffers(0, 1, vertex_buffer_.Receive(), &stride, &offset);
  device_->IASetPrimitiveTopology(D3D10_PRIMITIVE_TOPOLOGY_TRIANGLELIST);

  RECT cr;
  GetClientRect(hwnd_, &cr);
  OnSize(cr.right - cr.left, cr.bottom - cr.top);
}

void Window::OnPaint() {
  PAINTSTRUCT ps;
  HDC dc = BeginPaint(hwnd_, &ps);
  EndPaint(hwnd_, &ps);

  float clear_color[4] = { 0.0f, 0.125f, 0.3f, 1.0f };
  device_->ClearRenderTargetView(render_target_view_.get(), clear_color);

  D3D10_TECHNIQUE_DESC technique_desc;
  effect_technique_->GetDesc(&technique_desc);
  for (unsigned int p = 0; p < technique_desc.Passes; ++p) {
    effect_technique_->GetPassByIndex(p)->Apply(0);
    device_->Draw(3, 0);
  }

  swap_chain_->Present(0, 0);
}

void Window::OnSize(int width, int height) {
  CreateSwapChainForDevice(width, height);

  ScopedComPtr<ID3D10Texture2D> back_buffer;
  HRESULT hr = swap_chain_->GetBuffer(
      0,
      __uuidof(ID3D10Texture2D),
      reinterpret_cast<void**>(back_buffer.Receive()));
  hr = device_->CreateRenderTargetView(back_buffer, NULL,
                                       render_target_view_.Receive());
  HandleFailure(hr);
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

void Window::CreateSwapChainForDevice(int width, int height) {
  ScopedComPtr<IDXGIDevice> dxgi_device;
  dxgi_device.QueryFrom(device_.get());

  ScopedComPtr<IDXGIAdapter> dxgi_adapter;
  dxgi_device->GetParent(__uuidof(IDXGIAdapter),
                         reinterpret_cast<void**>(dxgi_adapter.Receive()));

  ScopedComPtr<IDXGIFactory> dxgi_factory;
  dxgi_adapter->GetParent(__uuidof(IDXGIFactory),
                          reinterpret_cast<void**>(dxgi_factory.Receive()));

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

  HRESULT hr = dxgi_factory->CreateSwapChain(device_.get(), &swap_chain_desc,
                                             swap_chain_.Receive());
  HandleFailure(hr);
}

void Window::HandleFailure(HRESULT hr) {
  if (FAILED(hr))
    MessageBox(hwnd_, L"Failure", L"Failure", MB_OK);
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
      window->OnCreate();
      break;
    case WM_ERASEBKGND:
      return 1;
    case WM_PAINT:
      window->OnPaint();
      break;
      /*
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
    case WM_SIZE:
      window->OnSize(LOWORD(l_param), HIWORD(l_param));
      break;
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

