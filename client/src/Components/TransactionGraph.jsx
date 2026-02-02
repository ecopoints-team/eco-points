import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3, PieChartIcon } from 'lucide-react';

const TransactionGraph = () => {
    const [chartType, setChartType] = useState('line');
    const [timeRange, setTimeRange] = useState('Daily');

    // Sample data for preview
    const data = [
        { time: '00:00', success: 145, failed: 12 },
        { time: '04:00', success: 89, failed: 8 },
        { time: '08:00', success: 312, failed: 23 },
        { time: '12:00', success: 456, failed: 34 },
        { time: '16:00', success: 523, failed: 28 },
        { time: '20:00', success: 267, failed: 19 },
    ];

    // Pie chart data
    const pieData = [
        {
            name: 'Successful',
            value: data.reduce((sum, item) => sum + item.success, 0),
            color: '#10b981'
        },
        {
            name: 'Failed',
            value: data.reduce((sum, item) => sum + item.failed, 0),
            color: '#ef4444'
        },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-600">{entry.name}:</span>
                            <span className="font-semibold text-gray-900">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const Button = ({ variant, size, iconName, onClick, children }) => {
        const Icon = iconName === 'TrendingUp' ? TrendingUp : iconName === 'BarChart3' ? BarChart3 : iconName === 'PieChartIcon' ? PieChartIcon : null;
        const baseClasses = "px-3 py-1.5 rounded-md font-medium transition-colors";
        const variantClasses = variant === 'default'
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-transparent text-gray-600 hover:bg-gray-100";

        return (
            <button className={`${baseClasses} ${variantClasses} text-xs`} onClick={onClick}>
                {Icon && <Icon className="w-4 h-4" />}
                {children}
            </button>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">Transaction Analytics</h3>
                    <p className="text-sm text-gray-600">Hourly success and failure rates</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <Button
                            variant={chartType === 'line' ? 'default' : 'ghost'}
                            iconName="TrendingUp"
                            onClick={() => setChartType('line')}
                        />
                        <Button
                            variant={chartType === 'bar' ? 'default' : 'ghost'}
                            iconName="BarChart3"
                            onClick={() => setChartType('bar')}
                        />
                        <Button
                            variant={chartType === 'pie' ? 'default' : 'ghost'}
                            iconName="PieChartIcon"
                            onClick={() => setChartType('pie')}
                        />
                    </div>

                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        {['Daily', 'Weekly', 'Yearly'].map((range) => (
                            <Button
                                key={range}
                                variant={timeRange === range ? 'default' : 'ghost'}
                                onClick={() => setTimeRange(range)}
                            >
                                {range}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="time"
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: '12px' }}
                                iconType="circle"
                            />
                            <Line
                                type="monotone"
                                dataKey="success"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ fill: '#10b981', r: 4 }}
                                activeDot={{ r: 6 }}
                                name="Successful"
                            />
                            <Line
                                type="monotone"
                                dataKey="failed"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={{ fill: '#ef4444', r: 4 }}
                                activeDot={{ r: 6 }}
                                name="Failed"
                            />
                        </LineChart>
                    ) : chartType === 'bar' ? (
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="time"
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: '12px' }}
                                iconType="circle"
                            />
                            <Bar
                                dataKey="success"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                                name="Successful"
                            />
                            <Bar
                                dataKey="failed"
                                fill="#ef4444"
                                radius={[4, 4, 0, 0]}
                                name="Failed"
                            />
                        </BarChart>
                    ) : (
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend
                                wrapperStyle={{ fontSize: '12px' }}
                                iconType="circle"
                            />
                        </PieChart>
                    )}
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div>
                    <p className="text-xs text-gray-600 mb-1">Total Transactions</p>
                    <p className="text-xl font-bold text-gray-900">
                        {data.reduce((sum, item) => sum + item.success + item.failed, 0).toLocaleString()}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-600 mb-1">Success Rate</p>
                    <p className="text-xl font-bold text-green-600">
                        {((data.reduce((sum, item) => sum + item.success, 0) / data.reduce((sum, item) => sum + item.success + item.failed, 0)) * 100).toFixed(1)}%
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-600 mb-1">Peak Hour</p>
                    <p className="text-xl font-bold text-gray-900">
                        {data.reduce((max, item) => (item.success + item.failed) > (max.success + max.failed) ? item : max).time}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-600 mb-1">Avg per Hour</p>
                    <p className="text-xl font-bold text-gray-900">
                        {Math.round(data.reduce((sum, item) => sum + item.success + item.failed, 0) / data.length)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TransactionGraph;