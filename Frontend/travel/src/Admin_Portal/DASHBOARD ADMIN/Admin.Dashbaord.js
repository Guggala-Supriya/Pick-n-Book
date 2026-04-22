import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ADMIN_BASE = '/admin';
const adminPath = (path = '') => (path ? `${ADMIN_BASE}/${path}` : ADMIN_BASE);

const Dashboard = () => {
    // Dynamic data for metrics
    const [metrics] = useState({
        bookings: 42,
        pending: 8,
        failed: 3,
        revenue: 'INR 1,25,000',
        lastLoginIp: '103.214.56.21',
        lastLogin: '13 Mar 2026 | 10:32 AM',
        revenueToday: 'INR 52,430',
        revenueGrowth: '+18%',
        b2cSuccessful: 128,
        successfulGrowth: '+12%',
        failedBookings: 9,
        pendingWorks: 14,
        pendingAmount: 'INR 573,16',
        pendingGrowth: '+18%',
    });

    // Dynamic chart data for bar graphs
    const [chartData] = useState({
        successful: [65, 78, 72, 85, 92, 88, 95],
        failed: [12, 8, 15, 6, 9, 11, 5],
        pending: [18, 22, 16, 20, 14, 19, 23],
    });

    const [chartLabels] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

    const maxValue = Math.max(...chartData.successful, ...chartData.failed, ...chartData.pending);

    return (
        <div className="dash-page" style={{ minWidth: 0, width: '100%' }}>
                {/* Status Banner */}
                <section className="status-banner">
                    <div className="status-title">Today's Status :</div>
                    <div className="status-content">
                        <div className="status-stat">
                            <span className="status-dot dot-orange" />
                            <span className="status-label">
                                <strong>{metrics.bookings}</strong> Bookings
                            </span>
                        </div>
                        <div className="status-stat">
                            <span className="status-dot dot-green" />
                            <span className="status-label">
                                <strong>{metrics.pending}</strong> Pending
                            </span>
                        </div>
                        <div className="status-stat">
                            <span className="status-dot dot-orange" />
                            <span className="status-label">
                                <strong>{metrics.failed}</strong> Failed
                            </span>
                        </div>
                        <span className="status-sep" />
                        <div className="status-stat">
                            <span className="status-label">
                                <strong>{metrics.revenue}</strong> Revenue
                            </span>
                        </div>
                    </div>
                </section>

                {/* Info Cards Grid */}
                <section className="info-grid">
                    <div className="info-card">
                        <div className="info-icon blue">IP</div>
                        <div className="info-body">
                            <div className="info-title">Last Login IP</div>
                            <div className="info-value">{metrics.lastLoginIp}</div>
                            <div className="info-foot">
                                <span className="info-check" />
                                <span>Security verified</span>
                            </div>
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="info-icon violet">LL</div>
                        <div className="info-body">
                            <div className="info-title">Last Login</div>
                            <div className="info-value">{metrics.lastLogin}</div>
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="info-icon green">INR</div>
                        <div className="info-body">
                            <div className="info-title">Revenue Today</div>
                            <div className="info-value">{metrics.revenueToday}</div>
                            <div className="info-foot trend-up">{metrics.revenueGrowth} vs yesterday</div>
                        </div>
                    </div>
                </section>

                {/* Metric Cards Grid */}
                <section className="metric-grid">
                    {/* Successful Bookings Card */}
                    <div className="metric-card success">
                        <div className="metric-title">Today's B2C Successful Bookings</div>
                        <div className="metric-number">{metrics.b2cSuccessful}</div>
                        <div className="metric-growth">
                            <span className="trend-up">{metrics.successfulGrowth}</span> growth
                        </div>

                        {/* Bar Chart */}
                        <div className="metric-chart-container">
                            <div className="chart-bars-wrapper">
                                {chartData.successful.map((value, idx) => (
                                    <div key={idx} className="bar-container">
                                        <div
                                            className="chart-bar success-bar"
                                            style={{ height: `${(value / maxValue) * 100}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="chart-labels-wrapper">
                                {chartLabels.map((label, idx) => (
                                    <div key={idx} className="chart-label">{label}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Failed Bookings Card */}
                    <div className="metric-card failed">
                        <div className="metric-title">B2C Failed Bookings</div>
                        <div className="metric-number">{metrics.failedBookings}</div>
                        <div className="metric-subtitle">API / Payment failures</div>

                        {/* Bar Chart */}
                        <div className="metric-chart-container">
                            <div className="chart-bars-wrapper">
                                {chartData.failed.map((value, idx) => (
                                    <div key={idx} className="bar-container">
                                        <div
                                            className="chart-bar failed-bar"
                                            style={{ height: `${(value / maxValue) * 100}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="chart-labels-wrapper">
                                {chartLabels.map((label, idx) => (
                                    <div key={idx} className="chart-label">{label}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pending Works Card */}
                    <div className="metric-card pending">
                        <div className="metric-title">Pending Works</div>
                        <div className="metric-number">{metrics.pendingWorks}</div>
                        <div className="metric-subtitle">Manual review required</div>

                        {/* Pending Works List */}
                        <div className="pending-list-container">
                            <div className="pending-item">
                                <div className="pending-item-header">
                                    <span className="pending-icon">📋</span>
                                    <span className="pending-item-title">Payment Review</span>
                                </div>
                                <span className="pending-item-badge">5 items</span>
                            </div>
                            <div className="pending-item">
                                <div className="pending-item-header">
                                    <span className="pending-icon">🔍</span>
                                    <span className="pending-item-title">Booking Verification</span>
                                </div>
                                <span className="pending-item-badge">3 items</span>
                            </div>
                            <div className="pending-item">
                                <div className="pending-item-header">
                                    <span className="pending-icon">⚠️</span>
                                    <span className="pending-item-title">Dispute Resolution</span>
                                </div>
                                <span className="pending-item-badge">2 items</span>
                            </div>
                            <div className="pending-item">
                                <div className="pending-item-header">
                                    <span className="pending-icon">✉️</span>
                                    <span className="pending-item-title">Customer Response</span>
                                </div>
                                <span className="pending-item-badge">4 items</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="quick-actions">
                    <h3>Quick Action Links</h3>
                    <div className="quick-grid">
                        <div className="quick-card">
                            <div className="quick-title">
                                <span className="quick-icon purple">CM</span>
                                <span>Customer Management</span>
                            </div>
                            <Link className="quick-item" to={adminPath('customer-management/customer-list')}>
                                <span>Customer List</span>
                                <span className="quick-arrow">&gt;</span>
                            </Link>
                            <Link className="quick-item" to={adminPath('customer-management/add-new-customer')}>
                                <span>Add Customer</span>
                                <span className="quick-arrow">&gt;</span>
                            </Link>
                        </div>

                        <div className="quick-card">
                            <div className="quick-title">
                                <span className="quick-icon blue">FL</span>
                                <span>B2C Flight Management</span>
                            </div>
                            <Link className="quick-item" to={adminPath('b2c-flight/booking-list')}>
                                <span>Booking List</span>
                                <span className="quick-arrow">&gt;</span>
                            </Link>
                            <Link className="quick-item" to={adminPath('b2c-flight/cancellation-requests')}>
                                <span>Cancellation List</span>
                                <span className="quick-arrow">&gt;</span>
                            </Link>
                        </div>

                        <div className="quick-card">
                            <div className="quick-title">
                                <span className="quick-icon orange">BUS</span>
                                <span>B2C Bus Management</span>
                            </div>
                            <Link className="quick-item" to={adminPath('b2c-bus/booking-list')}>
                                <span>Booking List</span>
                                <span className="quick-arrow">&gt;</span>
                            </Link>
                            <Link className="quick-item" to={adminPath('b2c-bus/cancellation-list')}>
                                <span>Cancellation List</span>
                                <span className="quick-arrow">&gt;</span>
                            </Link>
                        </div>
                    </div>
                </section>
        </div>
    );
};

export default Dashboard;
