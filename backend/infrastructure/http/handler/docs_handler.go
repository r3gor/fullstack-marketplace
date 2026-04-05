package handler

import (
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
)

type DocsHandler struct {
	specPath string
}

func NewDocsHandler(specPath string) *DocsHandler {
	return &DocsHandler{specPath: specPath}
}

// ScalarUI serves the Scalar API reference UI loaded from CDN.
func (h *DocsHandler) ScalarUI(c *fiber.Ctx) error {
	html := `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fullstack E-commerce API — Docs</title>
</head>
<body>
  <script
    id="api-reference"
    data-url="/docs/openapi.yaml"
    data-configuration='{"theme":"purple","darkMode":true}'
  ></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`
	c.Set(fiber.HeaderContentType, "text/html; charset=utf-8")
	return c.SendString(html)
}

// Spec serves the raw OpenAPI YAML file.
func (h *DocsHandler) Spec(c *fiber.Ctx) error {
	data, err := os.ReadFile(h.specPath)
	if err != nil {
		return domain.NewInternalError(err)
	}
	c.Set(fiber.HeaderContentType, "application/yaml")
	return c.Send(data)
}
