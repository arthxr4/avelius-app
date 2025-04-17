import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Get the userId from auth()
    const { userId } = await auth();

    // Protect the route by checking if the user is signed in
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the Backend API User object
    const user = await currentUser();
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the client member to check if user has access
    const { data: clientMember, error: clientMemberError } = await supabase
      .from("client_members")
      .select("client_id")
      .eq("user_email", user.emailAddresses[0].emailAddress)
      .single();

    if (clientMemberError || !clientMember) {
      return new NextResponse("Client member not found", { status: 404 });
    }

    // Get all onboarding fields
    const { data: onboardingFields, error: onboardingFieldsError } = await supabase
      .from("onboarding_fields")
      .select("*");

    if (onboardingFieldsError) {
      return new NextResponse("Failed to fetch onboarding fields", { status: 500 });
    }

    // Get existing responses for this client
    const { data: responses, error: responsesError } = await supabase
      .from("onboarding_responses")
      .select("*")
      .eq("client_id", clientMember.client_id);

    if (responsesError) {
      return new NextResponse("Failed to fetch responses", { status: 500 });
    }

    return NextResponse.json({
      clientId: clientMember.client_id,
      fields: onboardingFields,
      responses: responses,
    });
  } catch (error) {
    console.error("Error in onboarding GET route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 