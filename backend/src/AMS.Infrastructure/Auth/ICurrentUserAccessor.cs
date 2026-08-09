namespace AMS.Infrastructure.Auth;

public interface ICurrentUserAccessor
{
    Guid UserId { get; }
    string Role { get; }
    bool IsInRole(string role);
}
