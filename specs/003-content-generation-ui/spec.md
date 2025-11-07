# Feature Specification: Content Generation UI

**Feature Branch**: `003-content-generation-ui`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "Jetzt müssen wir die UI für den Prozess bauen. Schau in @youtube_transcript.md nach welche Seiten und Ansichten wir benötigen."

## Clarifications

### Session 2025-01-27

- Q: Wie werden mehrere Posts mit verschiedenen Schreibstilen für denselben Content Request in der UI dargestellt? → A: Gruppierte Ansicht mit Tabs/Pills zum Wechseln zwischen den 3 Schreibstilen (story_based, insight_focused, engagement_focused). Alle 3 Posts werden als Varianten eines Content Requests behandelt.
- Q: Wie detailliert sollen Loading States während der Content-Generierung angezeigt werden? → A: Granularer Progress mit spezifischen Status-Indikatoren für verschiedene Workflow-Schritte (z.B. "Transkript wird verarbeitet...", "AI generiert Content...", "Bilder werden erstellt...")
- Q: Wie soll die UI Status-Updates während der Content-Generierung empfangen? → A: Real-time Updates via WebSocket oder Server-Sent Events (SSE), wenn der n8n Workflow Updates sendet
- Q: Wie sollen Empty States in der Posts-Übersicht dargestellt werden? → A: Informative Empty States mit klarer Nachricht und Call-to-Action Button (z.B. "Noch keine Posts generiert" mit Button "Ersten Post generieren")
- Q: Welche Bearbeitungsmöglichkeiten soll der RichText-Editor für Post-Inhalte bieten? → A: Vollständiger RichText-Editor mit Formatierungsoptionen (fett, kursiv, Listen, Links, Absätze), aber keine komplexen Layouts

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Content Generation Request erstellen (Priority: P1)

Ein Content Creator möchte LinkedIn Content basierend auf verschiedenen Input-Quellen (YouTube-Video, Blog-Post oder Notizen) generieren lassen. Das System soll eine einfache Formular-Oberfläche bereitstellen, über die der Benutzer die Input-Quelle auswählen, das zugehörige Unternehmen angeben und optionale Parameter wie Custom Instructions und Call-to-Action festlegen kann.

**Why this priority**: Dies ist der Entry-Point für den gesamten Content-Generierungsprozess. Ohne diese Funktionalität kann kein Content generiert werden, was die Kernfunktionalität des Systems blockiert.

**Independent Test**: Kann vollständig getestet werden, indem ein Benutzer das Formular ausfüllt, einen Content-Generierungs-Request absendet und verifiziert, dass ein Generated Post mit Status "draft" erstellt wurde und der n8n Workflow getriggert wurde.

**Acceptance Scenarios**:

1. **Given** ein eingeloggter Content Creator, **When** er auf "Neuen Post generieren" klickt und ein YouTube-Video-URL, eine Company und optionale Parameter eingibt, **Then** wird ein Generated Post mit Status "draft" erstellt und der n8n Content Generation Workflow wird getriggert
2. **Given** ein eingeloggter Content Creator, **When** er einen Content-Generierungs-Request mit Blog-URL erstellt, **Then** wird der Blog-Content gescraped und als Input für die Content-Generierung verwendet
3. **Given** ein eingeloggter Content Creator, **When** er einen Content-Generierungs-Request mit Memo/Notizen erstellt, **Then** wird der Text als Input für die Content-Generierung verwendet und validiert (mindestens 50 Zeichen)
4. **Given** ein eingeloggter Content Creator, **When** er das "Generate Image" Flag aktiviert, **Then** wird zusätzlich ein AI-generiertes Bild für jeden der 3 Schreibstile erstellt

---

### User Story 2 - Generierte Posts Übersicht anzeigen (Priority: P1)

Ein Content Creator, Reviewer oder Manager möchte eine Übersicht aller generierten Posts sehen, um den Status zu überprüfen, Posts zu finden und zu verwalten. Die Übersicht soll Filterung nach Status, Company, Writing Style und Kategorie ermöglichen sowie eine Suche nach Titel oder Inhalt.

**Why this priority**: Die Übersicht ist essentiell für die Verwaltung und den Workflow. Ohne diese Ansicht können Benutzer nicht sehen, welche Posts generiert wurden, welchen Status sie haben oder welche Posts noch bearbeitet werden müssen.

**Independent Test**: Kann vollständig getestet werden, indem ein Benutzer die Übersichtsseite öffnet, verschiedene Filter anwendet, nach Posts sucht und verifiziert, dass die Ergebnisse korrekt gefiltert und sortiert werden.

**Acceptance Scenarios**:

1. **Given** ein eingeloggter Benutzer, **When** er die Generated Posts Übersicht öffnet, **Then** sieht er eine Liste aller für ihn sichtbaren Posts mit Titel, Company, Writing Style, Status und Erstellungsdatum
2. **Given** ein eingeloggter Benutzer, **When** keine Posts vorhanden sind, **Then** sieht er einen informativen Empty State mit Nachricht und Call-to-Action Button (z.B. "Noch keine Posts generiert" mit "Ersten Post generieren" Button)
3. **Given** ein eingeloggter Benutzer, **When** er nach Status "review" filtert, **Then** werden nur Posts im Review-Status angezeigt
4. **Given** ein eingeloggter Benutzer, **When** er nach einer Company filtert, **Then** werden nur Posts dieser Company angezeigt
5. **Given** ein eingeloggter Benutzer, **When** er nach einem Titel sucht, **Then** werden nur Posts angezeigt, deren Titel oder Inhalt den Suchbegriff enthalten

---

### User Story 3 - Generierten Post im Detail ansehen und bearbeiten (Priority: P1)

Ein Content Creator oder Reviewer möchte einen generierten Post im Detail ansehen, um den Inhalt zu überprüfen, zwischen den 3 Schreibstilen zu wechseln, Bilder zu sehen und den Post zu bearbeiten oder zu kommentieren.

**Why this priority**: Dies ist die Kernfunktionalität für den Review- und Bearbeitungsprozess. Ohne diese Ansicht können Benutzer nicht den generierten Content überprüfen, zwischen Schreibstilen wählen oder Posts bearbeiten.

**Independent Test**: Kann vollständig getestet werden, indem ein Benutzer einen Post öffnet, den Inhalt für alle 3 Schreibstile anzeigt, zwischen ihnen wechselt, Bilder betrachtet und den Post bearbeitet.

**Acceptance Scenarios**:

1. **Given** ein eingeloggter Benutzer, **When** er einen Generated Post öffnet, **Then** sieht er den Post-Titel, den Inhalt im RichText-Format, das zugehörige Writing Style, Status, Company, Kategorie, Tags und eventuelle Bilder
2. **Given** ein eingeloggter Benutzer, **When** ein Content Request mehrere Posts mit verschiedenen Schreibstilen generiert hat, **Then** werden alle Posts als gruppierte Varianten dargestellt mit Tabs/Pills zum Wechseln zwischen den Schreibstilen (Story-based, Insight-focused, Engagement-focused)
3. **Given** ein Content Creator, **When** er einen Post im Status "draft" bearbeitet, **Then** kann er Titel, Inhalt, Writing Style, Kategorie und Tags ändern
4. **Given** ein Reviewer, **When** er einen Post im Status "review" öffnet, **Then** kann er den Post genehmigen, ablehnen oder mit Kommentaren versehen

---

### User Story 4 - Post Status ändern und Review durchführen (Priority: P2)

Ein Reviewer möchte Posts im Review-Status überprüfen, genehmigen oder ablehnen. Ein Content Creator möchte einen Draft-Post zur Review einreichen. Ein Manager möchte genehmigte Posts planen.

**Why this priority**: Dies ermöglicht den Workflow von Draft → Review → Approved → Scheduled. Während wichtig für den vollständigen Prozess, kann das System auch ohne diese Funktionen verwendet werden (z.B. nur für Draft-Erstellung).

**Independent Test**: Kann vollständig getestet werden, indem ein Reviewer einen Post öffnet, den Status ändert, Kommentare hinzufügt und verifiziert, dass die Status-Übergänge korrekt validiert werden.

**Acceptance Scenarios**:

1. **Given** ein Content Creator mit einem Post im Status "draft", **When** er den Post zur Review einreicht, **Then** ändert sich der Status zu "review" und der Post wird für Reviewer sichtbar
2. **Given** ein Reviewer mit einem Post im Status "review", **When** er den Post genehmigt, **Then** ändert sich der Status zu "approved", reviewedBy und reviewedAt werden gesetzt
3. **Given** ein Reviewer mit einem Post im Status "review", **When** er den Post ablehnt und Kommentare hinzufügt, **Then** ändert sich der Status zu "rejected", reviewComments werden gespeichert
4. **Given** ein Manager mit einem Post im Status "approved", **When** er ein scheduledFor Datum setzt, **Then** ändert sich der Status zu "scheduled"

---

### User Story 5 - Company-Informationen anzeigen (Priority: P2)

Ein Content Creator möchte die Company-Informationen sehen, die für die Content-Generierung verwendet werden, einschließlich Business Overview, ICP und Value Proposition, um zu verstehen, welcher Kontext für die Generierung verwendet wurde.

**Why this priority**: Während hilfreich für Transparenz und Verständnis, ist dies nicht kritisch für die Grundfunktionalität. Die Content-Generierung funktioniert auch ohne diese Ansicht.

**Independent Test**: Kann vollständig getestet werden, indem ein Benutzer eine Company auswählt, die Company-Details ansieht und die Research-Informationen überprüft.

**Acceptance Scenarios**:

1. **Given** ein eingeloggter Benutzer, **When** er eine Company auswählt, **Then** sieht er Name, Industry, Business Overview, ICP, Value Proposition und Research Status
2. **Given** ein eingeloggter Benutzer, **When** er eine Company mit Research Status "completed" ansieht, **Then** werden die AI-generierten Informationen (Business Overview, ICP, Value Proposition) angezeigt

---

### Edge Cases

- Was passiert, wenn ein Content Generation Request ohne Company erstellt wird? → System sollte eine Fehlermeldung anzeigen, dass Company erforderlich ist
- Wie wird ein YouTube-Video ohne verfügbares Transkript behandelt? → System sollte eine Fehlermeldung anzeigen und den Post im Status "draft" belassen
- Was passiert, wenn ein Memo-Text weniger als 50 Zeichen hat? → System sollte eine Validierungsfehlermeldung anzeigen
- Wie wird ein Blog-Post behandelt, der nicht gescraped werden kann? → System sollte eine Fehlermeldung anzeigen und den Post im Status "draft" belassen
- Was passiert, wenn der n8n Workflow fehlschlägt? → System sollte den Post im Status "draft" belassen und eine Fehlermeldung loggen
- Wie wird ein Post behandelt, der bereits veröffentlicht wurde? → System sollte verhindern, dass Status-Änderungen vorgenommen werden
- Was passiert, wenn ein Benutzer versucht, einen Post zu bearbeiten, für den er keine Berechtigung hat? → System sollte eine Berechtigungsfehlermeldung anzeigen
- Wie werden mehrere Posts mit verschiedenen Schreibstilen für denselben Content Request angezeigt? → System zeigt alle Posts als gruppierte Varianten mit Tabs/Pills zum Wechseln zwischen den Schreibstilen

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow Content Creators to create a Content Generation Request with input type selection (YouTube, Blog, Memo)
- **FR-002**: System MUST require Company selection for Content Generation Requests
- **FR-003**: System MUST allow optional Custom Instructions and Call-to-Action selection for Content Generation Requests
- **FR-004**: System MUST allow optional "Generate Image" flag for Content Generation Requests
- **FR-005**: System MUST validate Memo input to be at least 50 characters
- **FR-006**: System MUST validate YouTube URL format
- **FR-007**: System MUST validate Blog URL format
- **FR-008**: System MUST display a list of all Generated Posts with filtering by Status, Company, Writing Style, and Category
- **FR-026**: System MUST display informative empty states when no posts are found, with clear messages and call-to-action buttons (e.g., "Noch keine Posts generiert" with "Ersten Post generieren" button)
- **FR-009**: System MUST provide search functionality for Generated Posts by title or content
- **FR-010**: System MUST display Generated Post details including title, content (RichText), writing style, status, company, category, tags, images, and metadata
- **FR-011**: System MUST display multiple posts with different writing styles from the same content request as grouped variants with Tabs/Pills navigation to switch between writing styles (story_based, insight_focused, engagement_focused)
- **FR-012**: System MUST allow Content Creators to edit Posts in "draft" status using a full-featured RichText editor with formatting options (bold, italic, lists, links, paragraphs), but without complex layouts
- **FR-013**: System MUST allow Content Creators to submit Posts for review (change status from "draft" to "review")
- **FR-014**: System MUST allow Reviewers to approve Posts (change status from "review" to "approved")
- **FR-015**: System MUST allow Reviewers to reject Posts (change status from "review" to "rejected") with optional comments
- **FR-016**: System MUST allow Managers to schedule approved Posts (change status from "approved" to "scheduled" with scheduledFor date)
- **FR-017**: System MUST validate status transitions according to business rules (draft → review → approved/rejected → scheduled → published)
- **FR-018**: System MUST display Company information including Business Overview, ICP, Value Proposition, and Research Status
- **FR-019**: System MUST display AI metadata (aiPrompt, aiModel, generatedAt) for Generated Posts
- **FR-020**: System MUST display images associated with Generated Posts (if available)
- **FR-021**: System MUST enforce access control based on user roles (Content Creator, Reviewer, Manager, Admin)
- **FR-022**: System MUST display error messages when Content Generation fails or n8n Workflow fails
- **FR-023**: System MUST show granular loading states during Content Generation process with specific status indicators for different workflow steps (e.g., "Transkript wird verarbeitet...", "AI generiert Content...", "Bilder werden erstellt...")
- **FR-024**: System MUST display status of Content Generation (pending, in progress, completed, failed) with step-specific progress indicators
- **FR-025**: System MUST receive real-time status updates via WebSocket or Server-Sent Events (SSE) when n8n workflow sends progress updates

### Key Entities _(include if feature involves data)_

- **GeneratedPost**: Represents an AI-generated LinkedIn post with content, writing style, status, and metadata. Key attributes: title, content (RichText), writingStyle, status, company, category, images, tags, aiPrompt, aiModel, generatedAt
- **Company**: Represents a company with business information used for content generation. Key attributes: name, industry, businessOverview, idealCustomerProfile, valueProposition, researchStatus
- **Content Generation Request**: Represents a request to generate content with input type (YouTube, Blog, Memo), company, and optional parameters. Creates GeneratedPost(s) with status "draft" and triggers n8n workflow

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Content Creators can create a Content Generation Request in under 1 minute
- **SC-002**: Users can view and filter the Generated Posts list in under 2 seconds
- **SC-003**: Users can view a Generated Post detail page in under 1 second
- **SC-004**: 90% of users successfully complete a Content Generation Request on first attempt
- **SC-005**: Users can switch between writing styles for the same content request in under 0.5 seconds
- **SC-006**: Reviewers can approve or reject a Post in under 30 seconds
- **SC-007**: System displays Content Generation status updates in real-time via WebSocket or Server-Sent Events (SSE) when n8n workflow sends updates, with updates visible within 5 seconds of workflow completion
- **SC-008**: 95% of status transitions are successfully processed without errors
- **SC-009**: Error messages are displayed within 2 seconds of an error occurring
- **SC-010**: All user roles (Content Creator, Reviewer, Manager, Admin) can access appropriate features based on their permissions
