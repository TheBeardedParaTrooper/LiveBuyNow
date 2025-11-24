import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  orderId: string
  amount: number
  phoneNumber: string
  provider: 'tigopesa' | 'mpesa' | 'airtelmoney' | 'halopesa'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { orderId, amount, phoneNumber, provider }: PaymentRequest = await req.json()

    console.log(`Initiating ${provider} payment for order ${orderId}`)

    // Get the provider module
    const providerModule = await import(`./providers/${provider}.ts`)
    
    // Initiate payment with the provider
    const result = await providerModule.initiatePayment({
      orderId,
      amount,
      phoneNumber,
    })

    // Update order with payment reference
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        payment_status: 'pending',
        notes: `Payment initiated via ${provider}. Reference: ${result.reference}`,
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        reference: result.reference,
        message: result.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Payment initiation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
