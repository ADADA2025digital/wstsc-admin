import React from "react";

const Home = () => {
  // Sample data for dashboard stats
  const stats = [
    { title: "Total Students", value: "245", icon: "bi-people-fill", color: "primary" },
    { title: "Active Classes", value: "12", icon: "bi-house-door-fill", color: "success" },
    { title: "Teachers", value: "18", icon: "bi-person-badge-fill", color: "info" },
    { title: "Events This Month", value: "5", icon: "bi-calendar-event-fill", color: "warning" }
  ];

  const recentActivities = [
    { activity: "New student registration", time: "2 hours ago", type: "registration" },
    { activity: "Tamil New Year event scheduled", time: "1 day ago", type: "event" },
    { activity: "Monthly progress reports generated", time: "2 days ago", type: "report" },
    { activity: "Cultural workshop completed", time: "3 days ago", type: "workshop" }
  ];

  const upcomingEvents = [
    { title: "Tamil Language Competition", date: "May 15, 2024", type: "Competition" },
    { title: "Parents-Teacher Meeting", date: "May 20, 2024", type: "Meeting" },
    { title: "Pongal Festival Celebration", date: "May 25, 2024", type: "Festival" }
  ];

  return (
    <div className="container-fluid">
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="jumbotron bg-light p-4 rounded">
            <h1 className="display-4 text-primary">
              Western Sydney Tamil Study Centre
            </h1>
            <p className="lead">
              Promoting the Tamil language and culture among Tamil-speaking people in Western Sydney
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        {stats.map((stat, index) => (
          <div key={index} className="col-xl-3 col-md-6 mb-4">
            <div className={`card border-left-${stat.color} shadow h-100 py-2`}>
              <div className="card-body">
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className={`text-xs fw-bold text-${stat.color} text-uppercase mb-1`}>
                      {stat.title}
                    </div>
                    <div className="h5 mb-0 fw-bold text-gray-800">{stat.value}</div>
                  </div>
                  <div className="col-auto">
                    <i className={`bi ${stat.icon} text-${stat.color} fs-1`}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        {/* Recent Activities */}
        <div className="col-xl-8 col-lg-7 mb-4">
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 fw-bold text-primary">
                <i className="bi bi-clock-history me-2"></i>
                Recent Activities
              </h6>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="list-group-item d-flex align-items-center px-0">
                    <div className="me-3">
                      <span className={`badge bg-${getActivityBadgeColor(activity.type)} p-2`}>
                        <i className={`bi ${getActivityIcon(activity.type)}`}></i>
                      </span>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold text-dark">{activity.activity}</div>
                      <small className="text-muted">
                        <i className="bi bi-clock me-1"></i>
                        {activity.time}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-xl-4 col-lg-5">
          {/* Upcoming Events */}
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 fw-bold text-primary">
                <i className="bi bi-calendar-check me-2"></i>
                Upcoming Events
              </h6>
            </div>
            <div className="card-body">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="mb-3 p-3 border-start border-primary border-3 bg-light rounded">
                  <div className="fw-bold text-dark">{event.title}</div>
                  <div className="small text-muted">
                    <i className="bi bi-calendar-event me-1"></i>
                    {event.date}
                  </div>
                  <span className={`badge bg-${getEventBadgeColor(event.type)} mt-1`}>
                    <i className={`bi ${getEventIcon(event.type)} me-1`}></i>
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper functions
  function getActivityBadgeColor(type) {
    const colors = {
      registration: 'success',
      event: 'info',
      report: 'warning',
      workshop: 'primary'
    };
    return colors[type] || 'secondary';
  }

  function getActivityIcon(type) {
    const icons = {
      registration: 'bi-person-plus',
      event: 'bi-calendar-event',
      report: 'bi-graph-up',
      workshop: 'bi-palette'
    };
    return icons[type] || 'bi-pin';
  }

  function getEventBadgeColor(type) {
    const colors = {
      Competition: 'danger',
      Meeting: 'info',
      Festival: 'warning'
    };
    return colors[type] || 'secondary';
  }

  function getEventIcon(type) {
    const icons = {
      Competition: 'bi-trophy',
      Meeting: 'bi-people',
      Festival: 'bi-emoji-laughing'
    };
    return icons[type] || 'bi-calendar';
  }
};

export default Home;