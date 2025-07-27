import React, { useState, useEffect } from 'react';
import './Deliveries.css';

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    // Dummy data for demonstration
    const dummyDeliveries = [
      {
        id: 1,
        orderId: "ORD001",
        customerName: "John Doe",
        address: "123 Farm Road, Mumbai, Maharashtra",
        deliveryDate: "2025-07-28",
        status: "In Transit",
        items: [
          { name: "Organic Tomatoes", quantity: 2 },
          { name: "Fresh Potatoes", quantity: 3 }
        ],
        deliveryPartner: "Express Delivery"
      },
      // Add more dummy deliveries as needed
    ];

    setDeliveries(dummyDeliveries);
  }, []);

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      // Dummy API call
      await fetch(`api/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      setDeliveries(prevDeliveries =>
        prevDeliveries.map(delivery =>
          delivery.id === deliveryId ? { ...delivery, status: newStatus } : delivery
        )
      );
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  return (
    <div className="deliveries">
      <h2>Deliveries</h2>
      <div className="deliveries-list">
        {deliveries.map(delivery => (
          <div key={delivery.id} className="delivery-card">
            <div className="delivery-header">
              <div>
                <h3>Delivery #{delivery.id}</h3>
                <p className="order-ref">Order: {delivery.orderId}</p>
              </div>
              <span className={`status ${delivery.status.toLowerCase().replace(' ', '-')}`}>
                {delivery.status}
              </span>
            </div>

            <div className="delivery-details">
              <div className="detail-group">
                <label>Customer</label>
                <p>{delivery.customerName}</p>
              </div>
              <div className="detail-group">
                <label>Delivery Address</label>
                <p>{delivery.address}</p>
              </div>
              <div className="detail-group">
                <label>Delivery Date</label>
                <p>{delivery.deliveryDate}</p>
              </div>
              <div className="detail-group">
                <label>Delivery Partner</label>
                <p>{delivery.deliveryPartner}</p>
              </div>
            </div>

            <div className="items-list">
              <h4>Items</h4>
              {delivery.items.map((item, index) => (
                <div key={index} className="item">
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="delivery-actions">
              <select
                value={delivery.status}
                onChange={(e) => handleStatusUpdate(delivery.id, e.target.value)}
                className="status-select"
              >
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Deliveries;
