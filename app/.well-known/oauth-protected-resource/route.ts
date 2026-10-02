export async function GET() {
 return Response.json({resource:'https://ea-action-tracker.vercel.app/mcp',authorization_servers:[`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`],scopes_supported:['openid'],bearer_methods_supported:['header'],resource_name:'EA Action Tracker'});
}
