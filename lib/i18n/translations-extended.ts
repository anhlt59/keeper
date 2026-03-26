import type { Lang } from "./translations";

/** Extended translations — merged into main dict at runtime */
export const translationsExtended: Record<string, Record<Lang, string>> = {
  // ── Attributes page ──
  "attributes.title": { en: "Attribute Definitions", vi: "Định nghĩa thuộc tính" },
  "attributes.subtitle": { en: "Define custom fields per asset category.", vi: "Định nghĩa trường tùy chỉnh theo danh mục." },
  "attributes.newAttribute": { en: "New Attribute", vi: "Thuộc tính mới" },
  "attributes.fieldType": { en: "Type", vi: "Loại" },
  "attributes.noAttributes": { en: "No attribute definitions yet", vi: "Chưa có định nghĩa thuộc tính" },
  "attributes.noAttributesHint": { en: "Create custom fields like RAM, Storage, or Color per category.", vi: "Tạo trường tùy chỉnh như RAM, Dung lượng, hoặc Màu theo danh mục." },
  "attributes.createFirst": { en: "Create First Attribute", vi: "Tạo thuộc tính đầu tiên" },
  "attributes.deleted": { en: "Definition deleted", vi: "Đã xóa định nghĩa" },
  "attributes.deleteFailed": { en: "Failed to delete definition", vi: "Xóa định nghĩa thất bại" },
  "attributes.deleteTitle": { en: "Delete Attribute Definition", vi: "Xóa định nghĩa thuộc tính" },
  "attributes.global": { en: "Global", vi: "Toàn cục" },

  // ── Attribute form ──
  "attrForm.editTitle": { en: "Edit Attribute Definition", vi: "Sửa định nghĩa thuộc tính" },
  "attrForm.addTitle": { en: "New Attribute Definition", vi: "Định nghĩa thuộc tính mới" },
  "attrForm.fieldTypeLabel": { en: "Field Type *", vi: "Loại trường *" },
  "attrForm.optionsLabel": { en: "Options (JSON array) *", vi: "Lựa chọn (mảng JSON) *" },
  "attrForm.optionsHint": { en: "Enter a JSON array of string options.", vi: "Nhập mảng JSON các lựa chọn." },
  "attrForm.requiredField": { en: "Required field", vi: "Trường bắt buộc" },
  "attrForm.namePlaceholder": { en: "e.g. RAM Size", vi: "VD: Dung lượng RAM" },
  "attrForm.descPlaceholder": { en: "Optional help text...", vi: "Văn bản hướng dẫn (tùy chọn)..." },
  "attrForm.globalCategory": { en: "Global (all categories)", vi: "Toàn cục (tất cả danh mục)" },
  "attrForm.typeText": { en: "Text", vi: "Văn bản" },
  "attrForm.typeNumber": { en: "Number", vi: "Số" },
  "attrForm.typeBoolean": { en: "Boolean (Yes/No)", vi: "Boolean (Có/Không)" },
  "attrForm.typeDate": { en: "Date", vi: "Ngày" },
  "attrForm.typeSelect": { en: "Select (Options)", vi: "Lựa chọn" },
  "attrForm.updated": { en: "Definition updated", vi: "Cập nhật định nghĩa thành công" },
  "attrForm.created": { en: "Definition created", vi: "Tạo định nghĩa thành công" },
  "attrForm.saveFailed": { en: "Failed to save", vi: "Lưu thất bại" },
  "attrForm.selectOption": { en: "Select option", vi: "Chọn lựa chọn" },

  // ── Maintenance page ──
  "maintenance.subtitle": { en: "All maintenance records", vi: "Tất cả bản ghi bảo trì" },
  "maintenance.asset": { en: "Asset", vi: "Tài sản" },
  "maintenance.noRecords": { en: "No maintenance records found", vi: "Không tìm thấy bản ghi bảo trì" },
  "maintenance.viewAsset": { en: "View Asset", vi: "Xem tài sản" },

  // ── Invoices page ──
  "invoices.subtitle": { en: "Upload and manage purchase invoices with OCR extraction.", vi: "Tải lên và quản lý hóa đơn mua hàng với OCR." },
  "invoices.upload": { en: "Upload Invoice", vi: "Tải hóa đơn" },
  "invoices.vendor": { en: "Vendor", vi: "Nhà cung cấp" },
  "invoices.amount": { en: "Amount", vi: "Số tiền" },
  "invoices.created": { en: "Created", vi: "Ngày tạo" },
  "invoices.noInvoices": { en: "No invoices yet", vi: "Chưa có hóa đơn" },
  "invoices.noInvoicesHint": { en: "Upload a photo of an invoice to extract data automatically.", vi: "Tải ảnh hóa đơn để trích xuất dữ liệu tự động." },
  "invoices.uploadFirst": { en: "Upload First Invoice", vi: "Tải hóa đơn đầu tiên" },
  "invoices.deleted": { en: "Invoice deleted", vi: "Đã xóa hóa đơn" },
  "invoices.deleteFailed": { en: "Failed to delete invoice", vi: "Xóa hóa đơn thất bại" },
  "invoices.deleteTitle": { en: "Delete Invoice", vi: "Xóa hóa đơn" },

  // ── Invoice detail ──
  "invoiceDetail.title": { en: "Invoice Details", vi: "Chi tiết hóa đơn" },
  "invoiceDetail.confirmed": { en: "Confirmed invoice with extracted data.", vi: "Hóa đơn đã xác nhận với dữ liệu trích xuất." },
  "invoiceDetail.review": { en: "Review invoice details and OCR extraction.", vi: "Xem xét chi tiết hóa đơn và dữ liệu OCR." },
  "invoiceDetail.invoiceNumber": { en: "Invoice Number", vi: "Số hóa đơn" },
  "invoiceDetail.invoiceDate": { en: "Invoice Date", vi: "Ngày hóa đơn" },
  "invoiceDetail.totalAmount": { en: "Total Amount", vi: "Tổng tiền" },
  "invoiceDetail.invoiceImage": { en: "Invoice Image", vi: "Ảnh hóa đơn" },
  "invoiceDetail.viewImage": { en: "View Image", vi: "Xem ảnh" },
  "invoiceDetail.ocrData": { en: "OCR Extraction Data", vi: "Dữ liệu OCR" },
  "invoiceDetail.ocrResponse": { en: "OCR Response", vi: "Phản hồi OCR" },
  "invoiceDetail.confidence": { en: "confidence", vi: "độ tin cậy" },
  "invoiceDetail.assetsCreated": { en: "asset(s) created", vi: "tài sản đã tạo" },
  "invoiceDetail.noAssets": { en: "No assets were created from this invoice.", vi: "Chưa có tài sản nào được tạo từ hóa đơn này." },
  "invoiceDetail.confirmSuccess": { en: "Invoice confirmed", vi: "Đã xác nhận hóa đơn" },
  "invoiceDetail.confirmFailed": { en: "Failed to confirm invoice", vi: "Xác nhận hóa đơn thất bại" },
  "invoiceDetail.notFound": { en: "Invoice not found.", vi: "Không tìm thấy hóa đơn." },
  "invoiceDetail.confirmTitle": { en: "Confirm Invoice", vi: "Xác nhận hóa đơn" },
  "invoiceDetail.confirmDesc": { en: "Mark this invoice as confirmed? This action cannot be undone.", vi: "Đánh dấu hóa đơn đã xác nhận? Không thể hoàn tác." },
  "invoiceDetail.imageError": { en: "Image could not be loaded.", vi: "Không thể tải ảnh." },

  // ── Invoice upload flow ──
  "invoiceUpload.title": { en: "Upload Invoice", vi: "Tải hóa đơn" },
  "invoiceUpload.subtitle": { en: "Take a photo or upload an image of your invoice. The data will be extracted automatically.", vi: "Chụp ảnh hoặc tải ảnh hóa đơn. Dữ liệu sẽ được trích xuất tự động." },
  "invoiceUpload.step1": { en: "Upload", vi: "Tải lên" },
  "invoiceUpload.step2": { en: "Review", vi: "Xem xét" },
  "invoiceUpload.step3": { en: "Confirm", vi: "Xác nhận" },
  "invoiceUpload.step1Title": { en: "Step 1: Upload Image", vi: "Bước 1: Tải ảnh" },
  "invoiceUpload.step2Title": { en: "Step 2: Review Extracted Data", vi: "Bước 2: Xem dữ liệu trích xuất" },
  "invoiceUpload.step3Title": { en: "Step 3: Confirm & Save", vi: "Bước 3: Xác nhận & Lưu" },
  "invoiceUpload.extracting": { en: "Extracting...", vi: "Đang trích xuất..." },
  "invoiceUpload.extractBtn": { en: "Extract Data →", vi: "Trích xuất →" },
  "invoiceUpload.reupload": { en: "← Re-upload", vi: "← Tải lại" },
  "invoiceUpload.looksGood": { en: "Looks Good →", vi: "Tiếp tục →" },
  "invoiceUpload.dragDrop": { en: "Drag & drop or click to upload", vi: "Kéo thả hoặc nhấn để tải" },
  "invoiceUpload.selectImage": { en: "Please select an image first", vi: "Vui lòng chọn ảnh trước" },
  "invoiceUpload.extracted": { en: "Invoice data extracted", vi: "Đã trích xuất dữ liệu hóa đơn" },
  "invoiceUpload.ocrFailed": { en: "OCR extraction failed", vi: "Trích xuất OCR thất bại" },
  "invoiceUpload.assetsToCreate": { en: "Assets to Create", vi: "Tài sản sẽ tạo" },
  "invoiceUpload.assetsHint": { en: "Edit asset details before confirming. Assets with empty names will be skipped.", vi: "Sửa chi tiết tài sản trước khi xác nhận. Tài sản không có tên sẽ bị bỏ qua." },
  "invoiceUpload.confirming": { en: "Confirming...", vi: "Đang xác nhận..." },
  "invoiceUpload.confirmInvoice": { en: "Confirm Invoice", vi: "Xác nhận hóa đơn" },
  "invoiceUpload.confirmSuccess": { en: "Invoice confirmed and saved", vi: "Đã xác nhận và lưu hóa đơn" },
  "invoiceUpload.confirmFailed": { en: "Failed to confirm invoice", vi: "Xác nhận hóa đơn thất bại" },
  "invoiceUpload.ocrConfidence": { en: "OCR Confidence", vi: "Độ tin cậy OCR" },
  "invoiceUpload.lowConfidence": { en: "— Please review low-confidence fields (marked in amber/red)", vi: "— Vui lòng kiểm tra các trường có độ tin cậy thấp" },
  "invoiceUpload.detectedAssets": { en: "Detected Assets", vi: "Tài sản phát hiện" },
  "invoiceUpload.invoiceDetails": { en: "Invoice Details", vi: "Chi tiết hóa đơn" },
  "invoiceUpload.number": { en: "Number", vi: "Số" },
  "invoiceUpload.unitPrice": { en: "Unit Price", vi: "Đơn giá" },
  "invoiceUpload.quantity": { en: "Quantity", vi: "Số lượng" },

  // ── Audit logs page ──
  "auditLogs.subtitle": { en: "System-wide activity history", vi: "Lịch sử hoạt động toàn hệ thống" },
  "auditLogs.entityType": { en: "Entity Type", vi: "Loại đối tượng" },
  "auditLogs.actionType": { en: "Action Type", vi: "Loại hành động" },
  "auditLogs.allEntities": { en: "All Entities", vi: "Tất cả đối tượng" },
  "auditLogs.allActions": { en: "All Actions", vi: "Tất cả hành động" },
  "auditLogs.timestamp": { en: "Timestamp", vi: "Thời gian" },
  "auditLogs.user": { en: "User", vi: "Người dùng" },
  "auditLogs.action": { en: "Action", vi: "Hành động" },
  "auditLogs.entity": { en: "Entity", vi: "Đối tượng" },
  "auditLogs.system": { en: "System", vi: "Hệ thống" },
  "auditLogs.noLogs": { en: "No audit logs found", vi: "Không tìm thấy nhật ký" },
  "auditLogs.noLogsHint": { en: "Try adjusting your filters.", vi: "Thử điều chỉnh bộ lọc." },

  // ── Scan page ──
  "scan.title": { en: "Scan Asset QR", vi: "Quét mã QR tài sản" },
  "scan.subtitle": { en: "Point your camera at an asset QR code to view its details instantly.", vi: "Hướng camera vào mã QR tài sản để xem chi tiết ngay." },
  "scan.backToDashboard": { en: "← Dashboard", vi: "← Trang chủ" },
  "scan.cameraNotAvailable": { en: "Camera not available", vi: "Camera không khả dụng" },
  "scan.cameraHint": { en: "Allow camera access or enter the asset ID manually below.", vi: "Cho phép truy cập camera hoặc nhập mã tài sản bên dưới." },
  "scan.assetId": { en: "Asset ID", vi: "Mã tài sản" },
  "scan.enterAssetId": { en: "Enter asset ID", vi: "Nhập mã tài sản" },
  "scan.lookup": { en: "Lookup", vi: "Tra cứu" },
  "scan.useCamera": { en: "Use Camera", vi: "Dùng camera" },
  "scan.enterManually": { en: "Enter Manually", vi: "Nhập thủ công" },
  "scan.pointCamera": { en: "Point camera at QR code", vi: "Hướng camera vào mã QR" },
  "scan.notFound": { en: "Asset not found", vi: "Không tìm thấy tài sản" },
  "scan.invalidQR": { en: "Invalid QR code format", vi: "Định dạng mã QR không hợp lệ" },
  "scan.enterIdRequired": { en: "Enter an asset ID", vi: "Nhập mã tài sản" },

  // ── Login page ──
  "login.appSubtitle": { en: "Asset Management System", vi: "Hệ thống quản lý tài sản" },
  "login.email": { en: "Email", vi: "Email" },
  "login.password": { en: "Password", vi: "Mật khẩu" },
  "login.signIn": { en: "Sign In", vi: "Đăng nhập" },
  "login.signingIn": { en: "Signing in...", vi: "Đang đăng nhập..." },
  "login.invalidCredentials": { en: "Invalid credentials", vi: "Thông tin đăng nhập không hợp lệ" },
  "login.error": { en: "Something went wrong. Please try again.", vi: "Đã xảy ra lỗi. Vui lòng thử lại." },

  // ── Pagination ──
  "pagination.pageOf": { en: "Page {page} of {total} — {count} results", vi: "Trang {page}/{total} — {count} kết quả" },

  // ── Asset lookup (public) ──
  "lookup.viewFull": { en: "View Full", vi: "Xem đầy đủ" },
  "lookup.footer": { en: "Asset managed with Zoo", vi: "Tài sản được quản lý bởi Zoo" },

  // ── FSM transition labels ──
  "fsm.assignToEmployee": { en: "Assign to employee/department", vi: "Giao cho nhân viên/phòng ban" },
  "fsm.markInUse": { en: "Mark as in use", vi: "Đánh dấu đang dùng" },
  "fsm.sendToMaintenance": { en: "Send to maintenance", vi: "Gửi bảo trì" },
  "fsm.maintenanceComplete": { en: "Maintenance complete", vi: "Hoàn thành bảo trì" },
  "fsm.retireAsset": { en: "Retire asset", vi: "Thanh lý tài sản" },
  "fsm.disposeAsset": { en: "Dispose asset", vi: "Xử lý tài sản" },
  "fsm.restoreFromDisposal": { en: "Restore from disposal", vi: "Khôi phục tài sản" },
  "fsm.recall": { en: "Recall (unassign)", vi: "Thu hồi" },

  // ── Maintenance form ──
  "maintForm.description": { en: "Record maintenance for {name}.", vi: "Ghi nhận bảo trì cho {name}." },
  "maintForm.descPlaceholder": { en: "Describe the maintenance work...", vi: "Mô tả công việc bảo trì..." },
  "maintForm.performedByPlaceholder": { en: "e.g. IT Support", vi: "VD: Bộ phận IT" },

  // ── QR Scanner ──
  "scan.assetNotFound": { en: "Asset does not exist", vi: "Tài sản không tồn tại" },
  "scan.validateFailed": { en: "Failed to validate asset", vi: "Xác thực tài sản thất bại" },

  // ── Invoice upload ──
  "invoiceUpload.fileTooLarge": { en: "File too large. Max {max}MB.", vi: "File quá lớn. Tối đa {max}MB." },
  "invoiceUpload.unsupportedFileType": { en: "Unsupported file type. Please upload a JPG or PNG image.", vi: "Định dạng không hỗ trợ. Vui lòng tải ảnh JPG hoặc PNG." },
  "invoiceUpload.fileFormatHint": { en: "JPG, PNG · Max {max}MB", vi: "JPG, PNG · Tối đa {max}MB" },
  "invoiceUpload.assetNumber": { en: "Asset #{n}", vi: "Tài sản #{n}" },
  "invoiceUpload.assetNamePlaceholder": { en: "Asset name", vi: "Tên tài sản" },
  "invoiceUpload.invoicePreview": { en: "Invoice preview", vi: "Xem trước hóa đơn" },

  // ── Asset detail extra ──
  "assetDetail.loadError": { en: "Asset not found or could not be loaded.", vi: "Không tìm thấy tài sản hoặc không thể tải." },
  "assetDetail.warrantyValue": { en: "{n} months", vi: "{n} tháng" },
  "assetDetail.maintenanceRecords": { en: "Maintenance Records", vi: "Lịch sử bảo trì" },
  "assetDetail.retireConfirm": { en: "Are you sure you want to retire \"{name}\" ({code})? This cannot be undone.", vi: "Bạn có chắc muốn thanh lý \"{name}\" ({code})? Không thể hoàn tác." },
  "assetDetail.deleteConfirm": { en: "Are you sure you want to permanently delete \"{name}\" ({code})? This cannot be undone.", vi: "Bạn có chắc muốn xóa vĩnh viễn \"{name}\" ({code})? Không thể hoàn tác." },

  // ── Categories page ──
  "categories.deleteConfirm": { en: "Delete \"{name}\"? This cannot be undone.", vi: "Xóa \"{name}\"? Không thể hoàn tác." },

  // ── Attributes page ──
  "attributes.deleteConfirm": { en: "Delete \"{name}\"? Existing asset values will be preserved but the schema definition will be removed.", vi: "Xóa \"{name}\"? Giá trị tài sản hiện tại sẽ được giữ nhưng định nghĩa trường sẽ bị xóa." },

  // ── Invoices page ──
  "invoices.deleteConfirm": { en: "Delete invoice from {vendor}? This cannot be undone.", vi: "Xóa hóa đơn từ {vendor}? Không thể hoàn tác." },
  "invoices.unknownVendor": { en: "unknown vendor", vi: "nhà cung cấp không rõ" },
  "invoiceDetail.deleteWithAssets": { en: "This will delete the invoice and {count} related asset(s). This cannot be undone.", vi: "Sẽ xóa hóa đơn và {count} tài sản liên quan. Không thể hoàn tác." },
  "invoiceDetail.deleteNoAssets": { en: "Delete this invoice? This cannot be undone.", vi: "Xóa hóa đơn này? Không thể hoàn tác." },
};
