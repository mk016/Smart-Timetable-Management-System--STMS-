import { NextRequest, NextResponse } from "next/server";

import { getRequestSession } from "@/lib/api-helpers";
import { getAppData } from "@/lib/app-data";
import { buildTimetableRows } from "@/lib/services/exporters";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getAppData({ ensureTimetable: true });
  const rows = buildTimetableRows(data, data.timetableEntries);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Timetable Export - STMS</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          margin: 0;
          padding: 2rem;
          color: #111;
        }
        .header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .header h1 {
          margin: 0;
          font-size: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .header p {
          color: #555;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 0.75rem;
          text-align: left;
        }
        th {
          background-color: #f8f9fa;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          color: #444;
        }
        tr:nth-child(even) {
          background-color: #fcfcfc;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body onload="setTimeout(() => window.print(), 500)">
      <div class="no-print" style="margin-bottom: 20px; background: #eef2ff; color: #4f46e5; padding: 12px; border-radius: 8px; text-align: center; font-size: 0.9rem;">
        This is a print-friendly version. The print dialog should open automatically. You can save it as a PDF from there.
      </div>
      <div class="header">
        <h1>Smart Timetable Management System</h1>
        <p>Complete Academic Schedule Export</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Batch</th>
            <th>Subject</th>
            <th>Teacher</th>
            <th>Room</th>
            <th>Slots</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              <td>${row.day}</td>
              <td>${row.batch}</td>
              <td>${row.subject}</td>
              <td>${row.teacher}</td>
              <td>${row.room}</td>
              <td>${row.slots}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    }
  });
}
