// utils/responseHandler.ts

export const success = (data: unknown = null, message = 'Success') => {
    return new Response(
        JSON.stringify({ success: true, message, data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
};

export const created = (data: unknown = null, message = 'Resource created') => {
    return new Response(
        JSON.stringify({ success: true, message, data }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
};

export const badRequest = (message = 'Bad request') => {
    return new Response(
        JSON.stringify({ success: false, message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
};

export const unauthorized = (message = 'Unauthorized') => {
    return new Response(
        JSON.stringify({ success: false, message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
};

export const notFound = (message = 'Not found') => {
    return new Response(
        JSON.stringify({ success: false, message }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
};

export const serverError = (
    message = 'Internal server error',
    error: Error | string = 'An unexpected error occurred'
) => {
    console.error('[SERVER ERROR]', error);
    return new Response(
        JSON.stringify({ success: false, message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
};

export const conflict = (message = 'Conflict') => {
    return new Response(
        JSON.stringify({ success: false, message }),
        {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
        }
    );
};
