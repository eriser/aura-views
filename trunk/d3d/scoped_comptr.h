#ifndef SCOPED_COMPTR_H_
#define SCOPED_COMPTR_H_

#include <unknwn.h>

template <class Interface>
class ScopedComPtr {
public:
  ScopedComPtr() : ptr_(NULL) {}
  ScopedComPtr(Interface* p) : ptr_(p) {
    if (ptr_)
      ptr_->AddRef();
  }
  ~ScopedComPtr() {
    if (ptr_)
      ptr_->Release();
  }

  void Release() {
    if (ptr_) {
      ptr_->Release();
      ptr_ = NULL;
    }
  }

  Interface* Detach() {
    Interface* p = ptr_;
    ptr_ = NULL;
    return p;
  }

  void Attach(Interface* p) {
    ptr_ = p;
  }

  Interface** Receive() {
    return &ptr_;
  }

  template <class Query>
  HRESULT QueryInterface(Query** p) {
    return ptr_->QueryInterface(p);
  }

  HRESULT QueryInterface(const IID& iid, void** obj) {
    return ptr_->QueryInterface(iid, obj);
  }

  HRESULT QueryFrom(IUnknown* object) {
    return object->QueryInterface(Receive());
  }

  Interface* get() const { return ptr_; }
  operator Interface*() const { return ptr_; }
  Interface* operator->() const { return ptr_; }
private:

  Interface* ptr_;
};

#endif  // SCOPED_COMPTR_H_

