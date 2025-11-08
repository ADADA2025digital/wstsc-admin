import React from "react";
import { Card } from "react-bootstrap";

const InfoCard = ({
  title,
  children,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  emptyState = false,
  emptyMessage = "No information available",
}) => {
  return (
    <Card className={`h-100 shadow-sm ${className}`}>
      <Card.Header
        className={`bg-secondary bg-opacity-10 border-bottom-0 ${headerClassName}`}
      >
        <h6 className="mb-0 H4-heading fw-semibold">{title}</h6>
      </Card.Header>
      <Card.Body className={`pt-3 ${bodyClassName}`}>
        {emptyState ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-inbox fs-1 opacity-50"></i>
            <p className="mt-2 mb-0">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </Card.Body>
    </Card>
  );
};

// Helper component for consistent empty states
export const EmptyState = ({ message = "No information available" }) => (
  <div className="text-center py-4 text-muted">
    <i className="bi bi-inbox fs-1 opacity-50"></i>
    <p className="mt-2 mb-0">{message}</p>
  </div>
);

export default InfoCard;
