#include <windows.h>
#include <dwmapi.h>

static const wchar_t* kWindowClass = L"BrokenGlassWindow";
static const wchar_t* kWindowTitle =
    L"BrokenGlass - Right click client area to toggle frame type.";
static const int kClientRectTopOffset = 40;

class Window {
 public:
  Window() {}
  ~Window() {}

  void Create() {
    CreateWindow(kWindowClass, kWindowTitle, WS_OVERLAPPEDWINDOW,
      CW_USEDEFAULT, 0, CW_USEDEFAULT, 0, NULL, NULL,
      instance, NULL);
  }

 private:
  void Resize(int width, int height) {
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
  }

  HWND hwnd_;
};

static bool g_glass = true;
bool IsGlass() {
  BOOL composition_enabled = FALSE;
  return DwmIsCompositionEnabled(&composition_enabled) == S_OK &&
      composition_enabled && g_glass;
}
void SetIsGlass(bool is_glass) {
  g_glass = is_glass;
}

void ToggleGlass(HWND hwnd) {
  DWMNCRENDERINGPOLICY policy = g_glass ? DWMNCRP_ENABLED : DWMNCRP_DISABLED;
  DwmSetWindowAttribute(hwnd, DWMWA_NCRENDERING_POLICY,
                        &policy, sizeof(DWMNCRENDERINGPOLICY));

  SetWindowPos(hwnd, NULL, 0, 0, 0, 0,
               SWP_NOSIZE | SWP_NOMOVE | SWP_NOZORDER | SWP_FRAMECHANGED);
  RedrawWindow(hwnd, NULL, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
}

LRESULT CALLBACK WndProc(HWND hwnd, UINT message, WPARAM w_param,
                         LPARAM l_param) {
  PAINTSTRUCT ps;
  HDC hdc;
  RECT wr;
  HBRUSH br;
  RECT* nccr = NULL;
  RECT dirty;
  RECT dirty_box;
  MARGINS dwmm = {0};
  WINDOWPOS* wp = NULL;
  int thickness = 0;
  POINT point;
  LRESULT l_result = 0;

  switch (message) {
    case WM_CREATE:
      SetCursor(LoadCursor(NULL, IDC_ARROW));
      break;
    case WM_ERASEBKGND:
      return 1;
    case WM_PAINT:
      hdc = BeginPaint(hwnd, &ps);
      GetClientRect(hwnd, &wr);
      br = static_cast<HBRUSH>(GetStockObject(BLACK_BRUSH));
      FillRect(hdc, &wr, br);
      wr.top += kClientRectTopOffset;
      br = GetSysColorBrush(IsGlass() ? COLOR_APPWORKSPACE : COLOR_WINDOW);
      FillRect(hdc, &wr, br);
      EndPaint(hwnd, &ps);
      break;
    case WM_NCPAINT:
      if (IsGlass())
        return DefWindowProc(hwnd, message, w_param, l_param);
      GetWindowRect(hwnd, &wr);
      if (!w_param|| w_param == 1) {
        dirty = wr;
        dirty.left = dirty.top = 0;
      } else {
        GetRgnBox(reinterpret_cast<HRGN>(w_param), &dirty_box);
        if (!IntersectRect(&dirty, &dirty_box, &wr))
          return 0;
        OffsetRect(&dirty, -wr.left, -wr.top);
      }
      hdc = GetWindowDC(hwnd);
      br = CreateSolidBrush(RGB(255,0,0));
      FillRect(hdc, &dirty, br);
      DeleteObject(br);
      ReleaseDC(hwnd, hdc);
      break;
    case WM_NCACTIVATE:
      // Force paint our non-client area otherwise Windows will paint its own.
      RedrawWindow(hwnd, NULL, NULL, RDW_UPDATENOW);
      break;
    case WM_NCCALCSIZE:
      nccr = w_param ? &reinterpret_cast<NCCALCSIZE_PARAMS*>(l_param)->rgrc[0]
                     : reinterpret_cast<RECT*>(l_param);
      if (IsGlass()) {
        thickness = GetSystemMetrics(SM_CXSIZEFRAME) - 2;
      }
      nccr->left += thickness;
      nccr->right -= thickness;
      nccr->bottom -= thickness;
      return 0;
    case WM_NCHITTEST:
      if (DwmDefWindowProc(hwnd, WM_NCHITTEST, 0, l_param, &l_result))
        return l_result;
      point.x = LOWORD(l_param);
      point.y = HIWORD(l_param);
      MapWindowPoints(NULL, hwnd, &point, 1);
      if (point.y < kClientRectTopOffset)
        return HTCAPTION;
      return DefWindowProc(hwnd, WM_NCHITTEST, w_param, l_param);
    case WM_RBUTTONDOWN:
      SetIsGlass(!g_glass);
      ToggleGlass(hwnd);
      break;
    case 0x31E: // WM_DWMCOMPOSITIONCHANGED:
      ToggleGlass(hwnd);
      break;    
    case 0xAE: // WM_NCUAHDRAWCAPTION:
    case 0xAF: // WM_NCUAHDRAWFRAME:
      return IsGlass() ? DefWindowProc(hwnd, message, w_param, l_param) : 0;
    case WM_WINDOWPOSCHANGED:
      dwmm.cxLeftWidth = 0;
      dwmm.cxRightWidth = 0;
      dwmm.cyTopHeight = kClientRectTopOffset;
      dwmm.cyBottomHeight = 0;
      DwmExtendFrameIntoClientArea(hwnd, &dwmm);
      break;
    case WM_DESTROY:
      PostQuitMessage(0);
      break;
    default:
      return DefWindowProc(hwnd, message, w_param, l_param);
  }
  return 0;
}

ATOM RegisterClazz(HINSTANCE instance) {
  WNDCLASSEX wcex = {0};
  wcex.cbSize = sizeof(wcex);
  wcex.style = CS_HREDRAW | CS_VREDRAW;
  wcex.lpfnWndProc = WndProc;
  wcex.hInstance = instance;
  wcex.lpszClassName = kWindowClass;
  return RegisterClassEx(&wcex);
}

int WINAPI WinMain(HINSTANCE instance, HINSTANCE, LPSTR, int show_command) {
  RegisterClazz(instance);
  HWND hwnd = CreateWindow(kWindowClass, kWindowTitle, WS_OVERLAPPEDWINDOW,
                           CW_USEDEFAULT, 0, CW_USEDEFAULT, 0, NULL, NULL,
                           instance, NULL);
  ShowWindow(hwnd, show_command);

  MSG msg;
  while (GetMessage(&msg, NULL, 0, 0)) {
    TranslateMessage(&msg);
    DispatchMessage(&msg);
  }
  return static_cast<int>(msg.wParam);
}

