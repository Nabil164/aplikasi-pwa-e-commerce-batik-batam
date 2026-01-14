"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/AdminSidebar";
import { resolveImageUrl } from "../../../lib/image";
import { Eye, X, Printer, RefreshCw, CheckCircle, Clock, XCircle, Truck, Package } from "lucide-react";
import api from "../../../lib/axios";

export default function AdminPesanan() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders/admin");
      if (response.data.status && response.data.data) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Fallback to localStorage if API fails
      const savedOrders = localStorage.getItem("orderHistory");
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    try {
      const response = await api.put(`/orders/${orderId}/status`, {
        status: newStatus,
      });
      
      if (response.data.status) {
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        alert("Status berhasil diperbarui!");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error.response?.data?.message || "Gagal memperbarui status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCheckPaymentStatus = async (order) => {
    setCheckingPayment(order.id);
    try {
      // Check payment status from Midtrans
      const response = await api.post("/payments/check-status", {
        orderId: order.id,
        transactionId: order.payment?.transactionId || null,
      });
      
      if (response.data.status && response.data.data) {
        const { payment, midtransStatus } = response.data.data;
        
        // Update local state with new status
        setOrders(orders.map(o => 
          o.id === order.id ? { 
            ...o, 
            status: payment?.order?.status || o.status,
            paymentStatus: payment?.status || o.paymentStatus,
            payment: payment || o.payment
          } : o
        ));
        
        const statusMessage = midtransStatus 
          ? `Status Midtrans: ${midtransStatus}` 
          : "Status berhasil diperbarui";
        alert(statusMessage);
        
        // Refresh orders to get latest data
        fetchOrders();
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      alert(error.response?.data?.message || "Gagal memeriksa status pembayaran");
    } finally {
      setCheckingPayment(null);
    }
  };

  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase() || "";
    if (statusUpper === "SELESAI" || statusUpper.includes("SELESAI")) {
      return "bg-green-100 text-green-700";
    }
    if (statusUpper === "DIBATALKAN" || statusUpper === "GAGAL" || statusUpper.includes("DIBATALKAN") || statusUpper.includes("GAGAL")) {
      return "bg-red-100 text-red-700";
    }
    if (statusUpper === "DIKIRIM" || statusUpper.includes("DIKIRIM")) {
      return "bg-blue-100 text-blue-700";
    }
    if (statusUpper === "DIPROSES" || statusUpper.includes("DIPROSES")) {
      return "bg-amber-100 text-amber-700";
    }
    if (statusUpper === "DIBAYAR" || statusUpper.includes("DIBAYAR")) {
      return "bg-green-100 text-green-700";
    }
    return "bg-yellow-100 text-yellow-700";
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    switch (paymentStatus?.toLowerCase()) {
      case 'paid':
        return <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"><CheckCircle size={12} /> Lunas</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full"><Clock size={12} /> Pending</span>;
      case 'failed':
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full"><XCircle size={12} /> Gagal</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"><Clock size={12} /> -</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank');
    const items = order.items || [];
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk Pembayaran - ${order.orderNumber || order.id}</title>
        <style>
          body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 10px; }
          .header h2 { margin: 0; font-size: 16px; }
          .header p { margin: 5px 0; font-size: 11px; color: #666; }
          .info { border-bottom: 1px dashed #333; padding-bottom: 10px; margin-bottom: 10px; }
          .info-row { display: flex; justify-content: space-between; font-size: 12px; margin: 3px 0; }
          .items { border-bottom: 1px dashed #333; padding-bottom: 10px; margin-bottom: 10px; }
          .item { margin-bottom: 8px; }
          .item-name { font-weight: bold; font-size: 12px; }
          .item-detail { display: flex; justify-content: space-between; font-size: 11px; }
          .totals { margin-bottom: 10px; }
          .total-row { display: flex; justify-content: space-between; font-size: 12px; margin: 3px 0; }
          .grand-total { font-weight: bold; border-top: 1px solid #333; padding-top: 5px; margin-top: 5px; }
          .footer { text-align: center; border-top: 2px dashed #333; padding-top: 10px; }
          .footer p { margin: 5px 0; font-size: 11px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>BATIK CINDUR BATAM</h2>
          <p>Jl. Batik Cindur No. 123, Batam</p>
          <p>Telp: (0778) 123-4567</p>
        </div>
        <div class="info">
          <div class="info-row"><span>No. Transaksi:</span><span>${order.orderNumber || order.id}</span></div>
          <div class="info-row"><span>Tanggal:</span><span>${formatDate(order.createdAt)}</span></div>
          <div class="info-row"><span>Pembeli:</span><span>${order.user?.name || order.address?.recipientName || "-"}</span></div>
        </div>
        <div class="items">
          <p style="font-weight:bold; font-size:11px; margin-bottom:5px;">DAFTAR BELANJA:</p>
          ${items.map(item => `
            <div class="item">
              <div class="item-name">${item.productName || item.product?.name || "-"}</div>
              <div class="item-detail">
                <span>${item.quantity} x Rp ${parseFloat(item.price || 0).toLocaleString('id-ID')}</span>
                <span>Rp ${parseFloat(item.subtotal || item.price * item.quantity || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="totals">
          <div class="total-row"><span>Subtotal:</span><span>Rp ${parseFloat(order.subtotal || 0).toLocaleString('id-ID')}</span></div>
          <div class="total-row"><span>Ongkir:</span><span>Rp ${parseFloat(order.shippingCost || 0).toLocaleString('id-ID')}</span></div>
          <div class="total-row grand-total"><span>TOTAL:</span><span>Rp ${parseFloat(order.total || 0).toLocaleString('id-ID')}</span></div>
        </div>
        <div class="info">
          <div class="info-row"><span>Metode Bayar:</span><span>${order.payment?.paymentMethod || "-"}</span></div>
          <div class="info-row"><span>Status Bayar:</span><span>${order.paymentStatus === 'paid' ? 'LUNAS' : order.paymentStatus?.toUpperCase() || 'PENDING'}</span></div>
          <div class="info-row"><span>Status Order:</span><span>${order.status || "-"}</span></div>
        </div>
        <div class="footer">
          <p><strong>Terima Kasih</strong></p>
          <p>Atas Kunjungan Anda</p>
        </div>
        <script>window.print(); window.close();</script>
      </body>
      </html>
    `;
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: "#F6F3EC" }}>
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#704d31] mx-auto mb-4"></div>
            <p className="text-[#5a3921]">Memuat pesanan...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F6F3EC" }}>
      <AdminSidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen" style={{ backgroundColor: "#F6F3EC" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-[#5a3921]">
              Pesanan
            </h1>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2 bg-[#704d31] text-white rounded-lg hover:bg-[#5a3921] transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          <div className="rounded-lg shadow-md overflow-x-auto bg-white">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID Pesanan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pembeli</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Produk</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pembayaran</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-gray-500 bg-white">
                      Belum ada pesanan
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <tr key={order.id || `order-${index}`} className="border-t border-gray-200 bg-white hover:bg-gray-50">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{order.orderNumber || `ORD-${order.id}`}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-sm">{order.user?.name || order.address?.recipientName || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {order.items?.[0] && (
                            <>
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <img 
                                  src={resolveImageUrl(
                                    order.items[0].product?.images?.[0]?.imageUrl || 
                                    order.items[0].product?.image_url ||
                                    order.items[0].image
                                  )} 
                                  alt={order.items[0].productName || order.items[0].product?.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.src = "/logo_batik.jpg"; }}
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium line-clamp-1">
                                  {order.items[0].productName || order.items[0].product?.name}
                                </p>
                                {order.items.length > 1 && (
                                  <p className="text-xs text-gray-500">+{order.items.length - 1} lainnya</p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#7b4d2a]">
                        Rp {parseFloat(order.total || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {getPaymentStatusBadge(order.paymentStatus)}
                          <button
                            onClick={() => handleCheckPaymentStatus(order)}
                            disabled={checkingPayment === order.id}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                          >
                            <RefreshCw size={12} className={checkingPayment === order.id ? "animate-spin" : ""} />
                            Cek Midtrans
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status || "MENUNGGU_PEMBAYARAN"}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={updatingStatus === order.id}
                          className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer ${getStatusColor(order.status)} disabled:opacity-50`}
                        >
                          <option value="MENUNGGU_PEMBAYARAN">Menunggu Pembayaran</option>
                          <option value="DIBAYAR">Pembayaran Berhasil</option>
                          <option value="DIPROSES">Sedang Diproses</option>
                          <option value="DIKIRIM">Sedang Dikirim</option>
                          <option value="SELESAI">Pesanan Selesai</option>
                          <option value="DIBATALKAN">Pesanan Dibatalkan</option>
                          <option value="GAGAL">Pembayaran Gagal</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setSelectedOrder(order); setShowDetail(true); }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Lihat Detail"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => handlePrintReceipt(order)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Cetak Struk"
                          >
                            <Printer size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {showDetail && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#5a3921]">Detail Pesanan</h2>
                  <p className="text-sm text-gray-500 font-mono">{selectedOrder.orderNumber || `ORD-${selectedOrder.id}`}</p>
                </div>
                <button 
                  onClick={() => setShowDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500">Tanggal</p>
                    <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pembeli</p>
                    <p className="font-medium">{selectedOrder.user?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status Pembayaran</p>
                    {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status Pesanan</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status || "MENUNGGU_PEMBAYARAN"}
                    </span>
                  </div>
                </div>

                {/* Payment Info */}
                {selectedOrder.payment && (
                  <div className="p-4 border rounded-xl bg-blue-50">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle size={16} className="text-blue-600" />
                      Informasi Pembayaran
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Transaction ID</p>
                        <p className="font-mono text-xs">{selectedOrder.payment.transactionId || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Metode</p>
                        <p>{selectedOrder.payment.paymentMethod || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="capitalize">{selectedOrder.payment.status || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tanggal Bayar</p>
                        <p>{selectedOrder.payment.paidAt ? formatDate(selectedOrder.payment.paidAt) : "-"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCheckPaymentStatus(selectedOrder)}
                      disabled={checkingPayment === selectedOrder.id}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={checkingPayment === selectedOrder.id ? "animate-spin" : ""} />
                      Cek Status dari Midtrans
                    </button>
                  </div>
                )}

                {/* Shipping Address */}
                <div className="p-4 border rounded-xl">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Truck size={16} className="text-[#704d31]" />
                    Alamat Pengiriman
                  </h3>
                  <p className="font-medium">{selectedOrder.address?.recipientName || "-"}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.address?.phoneNumber || "-"}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedOrder.address?.streetAddress || "-"}</p>
                  <p className="text-xs text-gray-500">
                    {selectedOrder.address?.district}, {selectedOrder.address?.city}, {selectedOrder.address?.province} {selectedOrder.address?.postalCode}
                  </p>
                </div>

                {/* Items */}
                <div className="p-4 border rounded-xl">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package size={16} className="text-[#704d31]" />
                    Produk ({selectedOrder.items?.length || 0} item)
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={resolveImageUrl(
                              item.product?.images?.[0]?.imageUrl || 
                              item.product?.image_url ||
                              item.image
                            )} 
                            alt={item.productName || item.product?.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = "/logo_batik.jpg"; }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.productName || item.product?.name}</p>
                          <p className="text-sm text-gray-500">
                            Ukuran: {item.size?.size || "-"} • Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-[#7b4d2a]">
                            Rp {parseFloat(item.subtotal || item.price * item.quantity || 0).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="p-4 bg-[#fdf3ec] rounded-xl">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>Rp {parseFloat(selectedOrder.subtotal || 0).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ongkos Kirim</span>
                      <span>Rp {parseFloat(selectedOrder.shippingCost || 0).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#e3d6c5] text-base font-bold text-[#7b4d2a]">
                      <span>Total</span>
                      <span>Rp {parseFloat(selectedOrder.total || 0).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => handlePrintReceipt(selectedOrder)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#704d31] text-white py-3 rounded-xl font-semibold hover:bg-[#5a3921] transition"
                >
                  <Printer size={18} />
                  Cetak Struk
                </button>
                <button 
                  onClick={() => setShowDetail(false)}
                  className="flex-1 py-3 border-2 border-[#e3d6c5] rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
