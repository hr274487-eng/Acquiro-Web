import { Share, Alert } from 'react-native';

export function formatOrdersForExport(orders) {
  return orders.map(o => ({
    'Order Ref': o.order_ref || `#${o.id}`,
    'Date Created': o.created_at ? new Date(o.created_at).toLocaleString() : '',
    'Status': (o.status || 'new').toUpperCase(),
    'Client Name': o.customer_name || o.name || 'N/A',
    'Email': o.customer_email || o.email || 'N/A',
    'Phone': o.customer_phone || o.phone || 'N/A',
    'Company': o.company_name || o.company || 'Direct Client',
    'Service Requested': o.service_type || o.service_requested || 'N/A',
    'Budget': o.budget || 'Custom Scope',
    'Timeline': o.timeline || 'Standard',
    'Order Scope & Details': o.order_details || o.message || '',
    'Manager Internal Notes': o.manager_notes || '',
    'Supabase ID': o.id
  }));
}

export async function exportOrdersAsCsv(orders) {
  try {
    const data = formatOrdersForExport(orders);
    if (!data.length) {
      Alert.alert('Export', 'No orders available to export.');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] == null ? '' : String(row[header]);
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\r\n');
    await Share.share({
      title: 'Acquiro Orders Export.csv',
      message: csvContent
    });
  } catch (error) {
    Alert.alert('Export Error', error.message || 'Unable to share CSV data.');
  }
}

export async function exportOrdersAsExcel(orders) {
  try {
    const data = formatOrdersForExport(orders);
    if (!data.length) {
      Alert.alert('Export', 'No orders available to export.');
      return;
    }

    let XLSX;
    try {
      XLSX = require('xlsx');
    } catch (e) {
      // If XLSX binary is not supported in environment, seamlessly fallback to CSV
      return exportOrdersAsCsv(orders);
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Acquiro Orders');

    const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const filename = `Acquiro_Orders_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

    await Share.share({
      title: filename,
      message: `Acquiro Orders Report Export (${orders.length} orders logged from Supabase database).\n\nBase64 Data payload prepared for XLSX viewing.`,
      url: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`
    });
  } catch (error) {
    Alert.alert('Export Error', error.message || 'Unable to generate Excel file.');
  }
}
