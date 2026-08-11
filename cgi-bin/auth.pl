#!/usr/bin/env perl
# ============================================================
# auth.pl — Ultra-compatible Perl 5.8 CGI for JAIST
# MD5 Hash Password Authentication
# ============================================================

use strict;
use CGI;
use CGI::Cookie;
use Digest::MD5 qw(md5_hex);

# ── 設定 ──
my $PASSWORD_HASH = 'd78dcd3c89b3aac9984758c512ec2e7a'; # デフォルト: "2023" のハッシュ
my $SALT          = 'notepad_jaist_2024_salt_v1';
my $COOKIE_NAME   = 'notepad_auth';
my $SECRET_TOKEN  = 'notepad_secret_token_2023';

my $cgi = CGI->new();
my $action = $cgi->param('action');
$action = 'check' unless defined $action;

my %cookies = CGI::Cookie->fetch();
my $cookie  = $cookies{$COOKIE_NAME};
my $is_auth = 0;
if ($cookie && $cookie->value() eq $SECRET_TOKEN) {
    $is_auth = 1;
}

if ($action eq 'check') {
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    if ($is_auth) {
        print '{"authenticated":1}';
    } else {
        print '{"authenticated":0}';
    }
}
elsif ($action eq 'login') {
    my $pw = $cgi->param('password');
    $pw = '' unless defined $pw;
    my $input_hash = md5_hex($SALT . $pw);

    if ($input_hash eq $PASSWORD_HASH) {
        my $c = CGI::Cookie->new(
            -name     => $COOKIE_NAME,
            -value    => $SECRET_TOKEN,
            -expires  => '+7d',
            -httponly => 1,
            -path     => '/'
        );
        print $cgi->header(-type => 'application/json', -charset => 'UTF-8', -cookie => $c);
        print '{"success":1}';
    } else {
        print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
        print '{"success":0,"error":"パスワードが違います"}';
    }
}
elsif ($action eq 'logout') {
    my $c = CGI::Cookie->new(
        -name    => $COOKIE_NAME,
        -value   => '',
        -expires => '-1d',
        -path    => '/'
    );
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8', -cookie => $c);
    print '{"success":1}';
}
elsif ($action eq 'change_password') {
    unless ($is_auth) {
        print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
        print '{"error":"unauthorized"}';
        exit;
    }
    my $cur = $cgi->param('current_password');
    $cur = '' unless defined $cur;
    my $nw  = $cgi->param('new_password');
    $nw = '' unless defined $nw;

    my $cur_hash = md5_hex($SALT . $cur);
    if ($cur_hash ne $PASSWORD_HASH) {
        print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
        print '{"error":"現在のパスワードが違います"}';
        exit;
    }
    if (length($nw) < 4) {
        print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
        print '{"error":"パスワードは4文字以上にしてください"}';
        exit;
    }

    my $new_hash = md5_hex($SALT . $nw);

    open(my $fh, '<', __FILE__) or do {
        print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
        print '{"error":"ファイルの読み込みに失敗しました"}';
        exit;
    };
    my $code = do { local $/; <$fh> };
    close($fh);

    $code =~ s/my \$PASSWORD_HASH\s*=\s*'.*?';/my \$PASSWORD_HASH = '$new_hash';/;

    open(my $fw, '>', __FILE__) or do {
        print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
        print '{"error":"ファイルの書き込みに失敗しました"}';
        exit;
    };
    print $fw $code;
    close($fw);

    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    print '{"success":1}';
}
else {
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    print '{"error":"Invalid action"}';
}
