#!/usr/bin/env perl
# ============================================================
# notes.pl — Ultra-compatible Perl 5.8 CGI for JAIST Notes CRUD
# ============================================================

use strict;
use CGI;
use CGI::Cookie;
use File::Basename qw(dirname);

my $COOKIE_NAME  = 'notepad_auth';
my $SECRET_TOKEN = 'notepad_secret_token_2023';

my $script_dir = dirname(__FILE__);
my $notes_dir  = -d "$script_dir/../notes" ? "$script_dir/../notes" 
               : (-d "$script_dir/../Online_Notepad/notes" ? "$script_dir/../Online_Notepad/notes" : "$script_dir/../notes");

unless (-d $notes_dir) {
    mkdir $notes_dir, 0777;
}

my $cgi = CGI->new();
my %cookies = CGI::Cookie->fetch();
my $cookie  = $cookies{$COOKIE_NAME};
my $is_auth = 0;
if ($cookie && $cookie->value() eq $SECRET_TOKEN) {
    $is_auth = 1;
}

unless ($is_auth) {
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    print '{"error":"unauthorized"}';
    exit;
}

my $action = $cgi->param('action');
$action = '' unless defined $action;

if ($action eq 'list') {
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    opendir(my $dh, $notes_dir) or do {
        print '{"notes":[]}';
        exit;
    };
    my @files = grep { /\.(txt|md)$/i } readdir($dh);
    closedir($dh);

    my @items;
    for my $f (sort @files) {
        my $ext  = ($f =~ /\.([^.]+)$/)[0];
        $ext = 'txt' unless defined $ext;
        my $name = $f;
        $name =~ s/\.\Q$ext\E$//;
        $name =~ s/_/ /g;
        push @items, sprintf('{"name":"%s","ext":"%s","filename":"%s"}',
            json_escape($name), lc($ext), json_escape($f));
    }
    print '{"notes":[' . join(',', @items) . ']}';
}
elsif ($action eq 'read') {
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    my $fn = $cgi->param('filename');
    $fn = '' unless defined $fn;

    if (!is_safe($fn) || !-f "$notes_dir/$fn") {
        print '{"error":"Note not found"}';
        exit;
    }
    open(my $fh, '<:utf8', "$notes_dir/$fn") or do {
        print '{"error":"Cannot read note"}';
        exit;
    };
    my $content = do { local $/; <$fh> };
    close($fh);

    $content = '' unless defined $content;
    print '{"content":"' . json_escape($content) . '"}';
}
elsif ($action eq 'save') {
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    my $fn      = $cgi->param('filename');
    $fn = '' unless defined $fn;
    my $content = $cgi->param('content');
    $content = '' unless defined $content;

    if (!is_safe($fn)) {
        print '{"error":"Invalid filename"}';
        exit;
    }
    open(my $fh, '>:utf8', "$notes_dir/$fn") or do {
        print '{"error":"Cannot write note"}';
        exit;
    };
    print $fh $content;
    close($fh);

    print '{"success":1}';
}
elsif ($action eq 'delete') {
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    my $fn = $cgi->param('filename');
    $fn = '' unless defined $fn;

    if (is_safe($fn) && -f "$notes_dir/$fn") {
        unlink "$notes_dir/$fn";
        print '{"success":1}';
    } else {
        print '{"error":"Delete failed"}';
    }
}
elsif ($action eq 'rename') {
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    my $old = $cgi->param('filename');
    $old = '' unless defined $old;
    my $new = $cgi->param('new_filename');
    $new = '' unless defined $new;

    if (is_safe($old) && is_safe($new) && -f "$notes_dir/$old" && !-f "$notes_dir/$new") {
        rename("$notes_dir/$old", "$notes_dir/$new");
        print '{"success":1}';
    } else {
        print '{"error":"Rename failed"}';
    }
}
else {
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    print '{"error":"Invalid action"}';
}

sub is_safe {
    my ($name) = @_;
    return 0 unless defined $name && length($name) > 0;
    return 0 if $name =~ m{[/\\]} || $name =~ /\.\./;
    return 0 unless $name =~ /\.(txt|md)$/i;
    return 1;
}

sub json_escape {
    my ($str) = @_;
    $str = '' unless defined $str;
    $str =~ s/\\/\\\\/g;
    $str =~ s/"/\\"/g;
    $str =~ s/\n/\\n/g;
    $str =~ s/\r/\\r/g;
    $str =~ s/\t/\\t/g;
    return $str;
}
