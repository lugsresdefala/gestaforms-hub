const ExcelJS = require('exceljs');

const appointments = [];// Populate this array with 216 approved appointment objects

// Group appointments by maternity and month
const groupedAppointments = {};

const months = ['Nov/2025', 'Dec/2025', 'Jan/2026'];
const maternities = ['Guarulhos', 'NotreCare', 'Salvalus', 'Cruzeiro'];

maternities.forEach(maternity => {
    groupedAppointments[maternity] = {};
    months.forEach(month => {
        groupedAppointments[maternity][month] = [];
    });
});

appointments.forEach(appointment => {
    const { date, maternity, patient } = appointment;
    const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (groupedAppointments[maternity] && groupedAppointments[maternity][monthKey]) {
        groupedAppointments[maternity][monthKey].push(patient);
    }
});

maternities.forEach(maternity => {
    months.forEach(month => {
        const workbook = new ExcelJS.Workbook();
        const calendarSheet = workbook.addWorksheet(`CALENDÁRIO ${month}`);
        const detailsSheet = workbook.addWorksheet('DETALHES');

        // Create visual calendar grid
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const cell = calendarSheet.getCell(week + 1, day + 1);
                // Assuming dates are calculated and assigned here
                // Apply gradient colors based on appointed density
                const density = calculateDensity(maternity, month);
                cell.fill = getColorByDensity(density);
                cell.comment = { 
                    text: getPatientList(maternity, month) 
                };
            }
        }

        // Populate the details sheet
        populateDetailsSheet(detailsSheet, groupedAppointments[maternity][month]);

        // Output to exports folder
        workbook.xlsx.writeFile(`exports/${maternity}_${month.replace('/', '-')}.xlsx`)
            .then(() => console.log(`File for ${maternity} - ${month} created.`));
    });
});

function calculateDensity(maternity, month) {
    // Implement logic to calculate appointment density
    return Math.floor(Math.random() * 10); // Example random density for demonstration
}

function getColorByDensity(density) {
    if (density === 0) return { type: 'gradient', stops: [{ position: 0, color: { argb: 'FFFFFFFF' } }, { position: 1, color: { argb: 'FFFFFFFF' } }] };
    if (density <= 2) return { type: 'gradient', stops: [{ position: 0, color: { argb: 'FF00FF00' } }, { position: 1, color: { argb: 'FF00FF00' } }] };
    if (density <= 4) return { type: 'gradient', stops: [{ position: 0, color: { argb: 'FFFFFF00' } }, { position: 1, color: { argb: 'FFFFFF00' } }] };
    if (density <= 7) return { type: 'gradient', stops: [{ position: 0, color: { argb: 'FFFFA500' } }, { position: 1, color: { argb: 'FFFFA500' } }] };
    return { type: 'gradient', stops: [{ position: 0, color: { argb: 'FFFF0000' } }, { position: 1, color: { argb: 'FFFF0000' } }] };
}

function getPatientList(maternity, month) {
    // Implement logic to retrieve patient list for the given maternity and month
    return 'Patient A, Patient B, Patient C'; // Example
}

function populateDetailsSheet(sheet, appointments) {
    // Add detailed info to the details sheet
}
