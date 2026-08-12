using System;

namespace AMS.Application.Contracts;

public interface ICurrentUserService
{
    Guid UserId { get; }
    string Role { get; }
    bool IsInRole(string role);
}
