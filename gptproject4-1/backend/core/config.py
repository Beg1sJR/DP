from fastapi.openapi.utils import get_openapi

def custom_openapi(app):
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title="CyberGuard API",
        version="1.0.0",
        description="API documentation with JWT auth",
        routes=app.routes,
    )

    # ✅ Безопасно создаём components
    if "components" not in schema:
        schema["components"] = {}

    if "securitySchemes" not in schema["components"]:
        schema["components"]["securitySchemes"] = {}

    schema["components"]["securitySchemes"]["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
    }

    schema["security"] = [{"BearerAuth": []}]
    app.openapi_schema = schema
    return schema
