import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { pdfBase64, fileName } = await req.json();
    
    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'PDF data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing PDF:', fileName);

    // Use Gemini Vision to extract structured data from PDF
    const systemPrompt = `You are a Thai PO (Purchase Order) document analyzer. Extract structured data from the provided PDF image.

IMPORTANT: The document is in Thai. Extract all data accurately FROM THE DOCUMENT. DO NOT CALCULATE ANY VALUES.

Return a JSON object with this EXACT structure:
{
  "po_number": "POB825124790",
  "supplier_code": "VLT-P0010",
  "supplier_name": "บริษัท พี.เอฟ.พี เทรดดิ้ง จำกัด",
  "branch": "ตะวันนา 2 บางกะปิ",
  "document_date": "2025-12-26",
  "due_date": "2026-01-08",
  "net_total": 17915.89,
  "vat": 1254.11,
  "grand_total": 19170.01,
  "items": [
    {
      "customer_product_code": "FG-FZ-0001",
      "customer_description": "ลูกชิ้นปลาฮ่องเต้",
      "quantity": 4.00,
      "unit": "ลัง",
      "unit_price": 962.62,
      "amount": 3850.47,
      "delivery_date": "2026-01-08"
    }
  ]
}

CRITICAL RULES for extracting totals:
- Look at the summary box on the bottom right of the document
- "รวมมูลค่า" (Gross Total) = net_total (value BEFORE VAT)
- "ภาษีมูลค่าเพิ่ม 7%" (Vat Total) = vat
- "มูลค่าสุทธิ" (Net Total) = grand_total (final total AFTER VAT)
- Extract these values EXACTLY as shown in the document. DO NOT calculate or recalculate any values.

Other rules:
- Extract dates in YYYY-MM-DD format
- Extract numbers without currency symbols or commas
- Extract ALL item rows from the table
- If a field is not found, use null
- Always return valid JSON
- For "branch": Look at "สถานที่จัดส่ง" (Delivery Location) field. Remove the word "สาขา" from the beginning if present. For example: "สาขา สาขา ตะวันนา 2 บางกะปิ" should become "ตะวันนา 2 บางกะปิ"`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: 'Extract all data from this Thai Purchase Order (PO) document. Return ONLY the JSON object, no markdown or explanation.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI Response:', content);

    // Parse the JSON from the response
    let extractedData;
    try {
      // Clean up the response - remove markdown code blocks if present
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      extractedData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('Extracted data:', extractedData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        fileName 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-po-pdf:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
