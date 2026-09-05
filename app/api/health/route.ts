export async function GET() {
  return Response.json({
    ok: true,
    service: 'lumagada',
    timestamp: new Date().toISOString(),
  });
}
