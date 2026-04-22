import React, { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getPopularBusOperatorById } from "../data/popularBuses";
import "./PopularBusRoutesPage.css";

function formatPrice(value) {
  return `₹${new Intl.NumberFormat("en-IN").format(value)}`;
}

function getDateInputValue() {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export default function PopularBusRoutesPage() {
  const navigate = useNavigate();
  const { operatorId } = useParams();
  const [openRouteId, setOpenRouteId] = useState(null);

  const operator = useMemo(
    () => getPopularBusOperatorById(operatorId),
    [operatorId]
  );

  const toggleRoute = (routeId) => {
    setOpenRouteId((current) => (current === routeId ? null : routeId));
  };

  const handleSearchRoute = (route) => {
    const payload = {
      source: route.from,
      destination: route.to,
      tripType: "oneway",
      departureDate: getDateInputValue(),
      returnDate: "",
    };

    const params = new URLSearchParams(payload);
    navigate(`/search/buses?${params.toString()}`, { state: payload });
  };

  if (!operator) {
    return (
      <main className="popular-routes-page">
        <div className="popular-routes-shell">
          <section className="popular-routes-empty">
            <h1>Bus operator not found</h1>
            <button type="button" onClick={() => navigate("/#popular-buses")}>
              Back to Popular Buses
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="popular-routes-page">
      <div className="popular-routes-shell">
        <header className="popular-routes-header">
          <button
            type="button"
            className="popular-routes-back"
            onClick={() => navigate("/#popular-buses")}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="popular-routes-title-wrap">
            <img src={operator.logo} alt={`${operator.shortName} logo`} />
            <div>
              <h1>{operator.shortName} Popular Routes</h1>
              <p>{operator.name}</p>
            </div>
          </div>
        </header>

        <section className="popular-routes-list" aria-label="Popular bus routes">
          {operator.routes.map((route) => {
            const isOpen = openRouteId === route.id;

            return (
              <article
                key={route.id}
                className={`popular-route-card ${isOpen ? "open" : ""}`}
              >
                <div className="popular-route-main">
                  <h2>{`${route.from} to ${route.to}`}</h2>
                  <p className="popular-route-duration">{route.duration}</p>
                  <p className="popular-route-services">{route.services}</p>
                </div>

                <div className="popular-route-price">
                  <strong>{formatPrice(route.price)}</strong>
                  <span>Onwards</span>
                  <em>{`${route.busCount} Buses`}</em>
                </div>

                <button
                  type="button"
                  className={`popular-route-toggle ${isOpen ? "open" : ""}`}
                  onClick={() => toggleRoute(route.id)}
                  aria-label={`Toggle more details for ${route.from} to ${route.to}`}
                >
                  <ChevronDown size={16} />
                </button>

                {isOpen && (
                  <div className="popular-route-expand">
                    <div className="popular-route-meta">
                      <span>First bus: 05:30 AM</span>
                      <span>Last bus: 11:40 PM</span>
                      <span>Live seats available now</span>
                    </div>
                    <button
                      type="button"
                      className="popular-route-action"
                      onClick={() => handleSearchRoute(route)}
                    >
                      Search Buses for This Route
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
